/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import { SegmentMessageDTO } from "@/dtos/MessageDTO";
import mongoose, { Schema, Types } from "mongoose";
import User from "@/database/user.model";
import MessageBox from "@/database/message-box.model";
import formidable from "formidable";
import cloudinary from "@/cloudinary";
import File from "@/database/file.model";
import { pusherServer } from "../pusher";

const generateRandomString = (length = 20) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

async function createFile(file: formidable.File, userId: string) {
  try {
    connectToDatabase();
    const mimetype = file.mimetype;
    let result = null;
    let type = "";
    if (mimetype?.startsWith("image/")) {
      // Upload hình ảnh
      result = await cloudinary.uploader.upload(file.filepath, {
        folder: "Avatar"
      });
      type = "Image";
    } else if (mimetype?.startsWith("video/")) {
      // Upload video
      result = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "video",
        folder: "Videos"
      });
      type = "Video";
    } else if (mimetype?.startsWith("audio/")) {
      // Upload âm thanh
      result = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw",
        folder: "Audios"
      });
      type = "Audio";
    } else {
      result = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw",
        folder: "Documents"
      });
      type = "Other";
    }

    const createdFile = await File.create({
      fileName: generateRandomString(),
      url: result.url,
      publicId: result.public_id,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
      type: type,
      createBy: new Types.ObjectId(userId)
    });
    return createdFile;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function createContent(data: SegmentMessageDTO, files: formidable.Files) {
  let contentIds: mongoose.Types.ObjectId[] = [];
  const userObjectId = new Types.ObjectId(data.userId);
  let text: string[] = [];

  if (typeof data.content === "string") {
    text = [data.content];
  } else if (["image", "audio", "video", "other"].includes(data.content.type)) {
    if (files.file) {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const createdFile = await createFile(file, data.userId);
      contentIds = [createdFile._id];
      text = [];
    } else {
      throw new Error("No file provided");
    }
  } else {
    throw new Error("Invalid content type");
  }

  // Tạo tin nhắn
  const message = await Message.create({
    flag: true,
    readedId: [data.userId],
    contentId: contentIds,
    text: text,
    createdAt: new Date(),
    updatedAt: new Date(),
    createBy: userObjectId
  });

  return message;
}

export async function createMessage(
  data: SegmentMessageDTO,
  files: formidable.Files
) {
  try {
    await connectToDatabase();

    if ((!data.userId && !data.recipientId) || data.recipientId.length === 0) {
      throw new Error("User ID and Recipient ID is required");
    }

    const userExists = await User.exists({ _id: data.userId });
    if (!userExists) {
      throw new Error("User does not exist");
    }
    if (!Array.isArray(data.recipientId) || data.recipientId.length === 0) {
      throw new Error("recipientId must be a non-empty array");
    }
    const recipientsExist = await User.find({
      _id: { $in: data.recipientId }
    }).limit(1);
    if (recipientsExist.length === 0) {
      throw new Error("Recipients do not exist");
    }

    const userObjectId = new Types.ObjectId(data.userId);

    if ("groupId" in data && data.groupId) {
      let groupMessageBox = await MessageBox.findById(data.groupId);
      if (!groupMessageBox) {
        throw new Error("Group MessageBox not found");
      }
      const membersIds = [
        ...groupMessageBox.receiverIds.map((id: { toString: () => any }) =>
          id.toString()
        ),
        groupMessageBox.senderId.toString()
      ];
      const allRecipientsExist = data.recipientId.every((recipient) =>
        membersIds.includes(recipient)
      );
      const leaderExists = membersIds.includes(data.userId);

      if (!allRecipientsExist || !leaderExists) {
        throw new Error(
          "All recipientIds and userId must be in MembersId list"
        );
      }

      const message = await createContent(data, files);
      const populatedMessage = await Message.findById(message._id).populate({
        path: "contentId",
        model: "File",
        select: "",
        options: { strictPopulate: false }
      });
      groupMessageBox = await MessageBox.findByIdAndUpdate(
        data.groupId,
        {
          $push: { messageIds: message._id },
          $addToSet: { receiverIds: { $each: data.recipientId } },
          $set: { senderId: data.userId }
        },
        { new: true }
      );
      if (!groupMessageBox) {
        throw new Error("Group MessageBox cannot update");
      }

      return { success: true, populatedMessage, groupMessageBox };
    } else {
      if (data.recipientId.length > 1) {
        throw new Error("Should create group before sending");
      } else {
        let messageBox = await MessageBox.findOneAndUpdate(
          {
            senderId: data.userId,
            $addToSet: { receiverIds: { $each: data.recipientId } }
          },
          { $set: { senderId: data.userId } },
          { new: true }
        );

        if (!messageBox) {
          const recipientExists = await User.exists({
            _id: { $in: data.recipientId }
          });
          if (!recipientExists) {
            throw new Error("Recipient does not exist");
          }

          messageBox = await MessageBox.create({
            senderId: data.userId,
            receiverIds: data.recipientId,
            messageIds: [],
            groupName: "",
            groupAva: "",
            flag: true,
            pin: false,
            createBy: userObjectId
          });
        }
        const message = await createContent(data, files);
        messageBox = await MessageBox.findByIdAndUpdate(
          messageBox._id,
          { $push: { messageIds: message._id } },
          { new: true }
        );
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: "File",
          select: "",
          options: { strictPopulate: false }
        });

        await pusherServer.trigger(
          `private-${messageBox._id}`,
          "new-message",
          message
        );

        return { success: true, populatedMessage, messageBox };
      }
    }
  } catch (error) {
    console.error("Error sending message: ", error);
    throw error;
  }
}

export async function createGroup(
  membersIds: string[],
  leaderId: string,
  groupName: string,
  groupAva: string
) {
  if (!Array.isArray(membersIds) || membersIds.length === 0) {
    throw new Error("membersIds must be a non-empty array");
  }
  const leaderExist = await User.exists({ _id: leaderId });
  if (!leaderExist) {
    throw new Error("Leader ID does not exist");
  }
  const allMembersExist = await User.exists({ _id: { $in: membersIds } });
  if (!allMembersExist) {
    throw new Error("One or more member IDs do not exist");
  }

  const userObjectId = new Types.ObjectId(leaderId);
  const messageBox = await MessageBox.create({
    senderId: leaderId,
    receiverIds: membersIds,
    messageIds: [],
    groupName: groupName,
    groupAva: groupAva,
    flag: true,
    pin: false,
    createBy: userObjectId
  });
  return { success: true, messageBoxId: messageBox._id, messageBox };
}

export async function recieveMessage(messageId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    return { success: true, message };
  } catch (error) {
    console.error("Error recieving message: ", error);
    throw error;
  }
}

export async function editMessage(
  messageId: string,
  newContent: string,
  userId: string
) {
  try {
    await connectToDatabase();

    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.readedId.includes(userId)) {
      if (message.text !== "" && message.contentId.length === 0) {
        message.text.push(newContent);
        message.updatedAt = new Date();
        await message.save();
        const updatedMessage = await Message.findById(messageId).populate(
          "contentId"
        );
        return { success: true, updatedMessage };
      } else {
        throw new Error("Only text can be edited");
      }
    } else {
      throw new Error("Unauthorized to edit this message");
    }
  } catch (error) {
    console.error("Error editing message: ", error);
    throw error;
  }
}

export async function deleteOrRevokeMessage(
  messageId: string,
  userId: string,
  action: "revoke" | "delete"
) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message is not found");
    }
    if (!message.readedId.includes(userId)) {
      throw new Error("Unauthorized to delete or recall this message");
    }

    if (action === "revoke") {
      if (message.text && message.text.length > 0) {
        message.text.push("Message revoked");
      } else if (message.contentId && message.contentId.length > 0) {
        message.text = message.text || [];
        message.text.push("Message revoked");
      }
      await message.save();
      return { success: true, message: "Message revoked" };
    } else if (action == "delete") {
      message.flag = false;
      await message.save();
      return { success: true, message: "Message deleted" };
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error deleting or recalling message: ", error);
    throw error;
  }
}

export async function fetchMessage(boxId: string) {
  try {
    await connectToDatabase();

    const messageBox = await MessageBox.findById(boxId).populate("messageIds");

    if (!messageBox) {
      throw new Error("MessageBox not found");
    }

    const messagesWithContent = await Promise.all(
      messageBox.messageIds.map(async (messageId: any) => {
        const message = await Message.findById(messageId);

        if (!message) {
          throw new Error(`Message not found for ID: ${messageId}`);
        }

        const populatedMessage = await Message.findById(messageId).populate({
          path: "contentId",
          model: message.contentModel,
          select: "",
          options: { strictPopulate: false }
        });

        return populatedMessage;
      })
    );

    return { success: true, messages: messagesWithContent };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function markMessageAsRead(boxId: string, recipientIds: string[]) {
  try {
    await connectToDatabase();

    const messageBox = await MessageBox.findById(boxId).populate("messageIds");
    if (!messageBox) {
      throw new Error("Box not found");
    }
    if (messageBox.messageIds.length === 0) {
      return null;
    }
    const recipientsExist = await User.find({
      _id: { $in: recipientIds }
    }).limit(1);
    if (recipientsExist.length === 0) {
      throw new Error("Recipients do not exist");
    }

    const lastMessage = messageBox.messageIds[messageBox.messageIds.length - 1];
    const notReadRecipients = recipientIds.filter(
      (id) => !lastMessage.readedId.includes(id)
    );

    if (notReadRecipients.length > 0) {
      await Promise.all(
        messageBox.messageIds.map(async (messageId: any) => {
          const message = await Message.findById(messageId);
          if (message) {
            notReadRecipients.forEach((recipientId) => {
              if (!message.readedId.includes(recipientId)) {
                message.readedId.push(recipientId);
              }
            });
            await message.save();
          }
        })
      );
      return {
        success: true,
        lastMessage,
        messages: "This message is read"
      };
    } else {
      return {
        success: true,
        lastMessage,
        messages: "This message has read before"
      };
    }
  } catch (error) {
    console.error("Error marking message as read: ", error);
    throw error;
  }
}

export async function findMessages(boxId: string, query: string) {
  try {
    await connectToDatabase();

    const messageBox = await MessageBox.findById(boxId).populate("messageIds");
    if (!messageBox) {
      throw new Error("Box not found");
    }
    if (messageBox.messageIds.length === 0) {
      return { success: false, messages: [] };
    }

    const messages = await Message.find({
      _id: { $in: messageBox.messageIds }
    }).populate("contentId");

    const resultMessages = messages.filter((message) => {
      // Tìm kiếm trong text
      if (message.text.length > 0) {
        return message.text.some((text: string) =>
          text.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Tìm kiếm trong fileName (nếu có contentId)
      if (message.contentId.length > 0) {
        const file = message.contentId[0];
        return file.fileName.toLowerCase().includes(query.toLowerCase());
      }

      return { success: false, messages: [] };
    });

    return { success: true, messages: resultMessages };
  } catch (error) {
    console.error("Error searching messages: ", error);
    throw error;
  }
}

export async function fetchBoxChat(userId: string) {
  try {
    await connectToDatabase();
    const messageBoxes = await MessageBox.find({
      senderId: userId,
      receiverIds: { $size: 1 }
    })
      .populate("senderId", "nickName")
      .populate("receiverIds", "nickName avatar")
      .populate("messageIds");
    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }
    // Lấy nội dung contentId từ messageId cuối cùng trong mỗi messageBox
    const messageBoxesWithContent = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lấy messageId cuối cùng
        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];

        if (!lastMessageId) {
          return messageBox; // Nếu không có messageId nào, trả về messageBox gốc
        }

        // Tìm message theo messageId cuối cùng
        const message = await Message.findById(lastMessageId);
        const populatedMessage = await Message.findById(lastMessageId)
          .populate({
            path: "contentId",
            model: message.contentModel,
            select: "",
            options: { strictPopulate: false }
          })
          .populate("readedId");

        if (populatedMessage && populatedMessage.contentId) {
          return {
            ...messageBox.toObject(),
            lastMessage: populatedMessage
          };
        }

        return messageBox;
      })
    );
    return { success: true, box: messageBoxesWithContent };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function fetchBoxGroup(userId: string) {
  try {
    await connectToDatabase();
    const messageBoxes = await MessageBox.find({
      senderId: userId,
      $expr: { $gt: [{ $size: "$receiverIds" }, 1] }
    })
      .populate("senderId", "nickName")
      .populate("receiverIds", "nickName avatar")
      .populate("messageIds");
    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }
    // Lấy nội dung contentId từ messageId cuối cùng trong mỗi messageBox
    const messageBoxesWithContent = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lấy messageId cuối cùng
        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];

        if (!lastMessageId) {
          return messageBox; // Nếu không có messageId nào, trả về messageBox gốc
        }

        // Tìm message theo messageId cuối cùng
        const message = await Message.findById(lastMessageId);
        const populatedMessage = await Message.findById(lastMessageId)
          .populate({
            path: "contentId",
            model: message.contentModel,
            select: "",
            options: { strictPopulate: false }
          })
          .populate("readedId");

        if (populatedMessage && populatedMessage.contentId) {
          return {
            ...messageBox.toObject(),
            lastMessage: populatedMessage
          };
        }

        return messageBox;
      })
    );
    return { success: true, box: messageBoxesWithContent };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

//MANAGEMENT
export async function getAllMessage() {
  try {
    await connectToDatabase();
    const allMessages = await Message.find();

    const messagesWithContent = await Promise.all(
      allMessages.map(async (message) => {
        const populatedContent = await mongoose
          .model(message.contentModel)
          .find({ _id: { $in: message.contentId } });
        return {
          ...message.toObject(),
          content: populatedContent
        };
      })
    );

    return { success: true, messages: messagesWithContent };
  } catch (error) {
    console.error("Error fetching all messages: ", error);
    throw error;
  }
}

export async function removeMessage(messageId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await Message.findByIdAndDelete(messageId);

    return { success: true, message: "Message removed from database" };
  } catch (error) {
    console.error("Error remove messages from database: ", error);
    throw error;
  }
}

export async function searchMessages(id?: string, query?: string) {
  try {
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any = {};
    if (id) {
      conditions._id = id;
    }

    const messages = await Message.find(conditions);

    let filteredMessages = messages;

    if (query) {
      filteredMessages = messages.filter((message) => {
        return message.contentModel === "Text";
      });

      const populatedMessages = await Promise.all(
        filteredMessages.map(async (message) => {
          const populatedMessage = await Message.findById(message._id).populate(
            {
              path: "contentId",
              model: message.contentModel,
              select: ""
            }
          );
          return populatedMessage;
        })
      );

      const resultMessages = populatedMessages.filter((populatedMessage) => {
        const content =
          populatedMessage?.contentId[populatedMessage?.contentId.length - 1];
        return (
          content.content &&
          content.content
            .toLowerCase()
            .trim()
            .includes(query.toLowerCase().trim())
        );
      });

      if (resultMessages.length === 0) {
        return { success: false, messages: [] };
      }

      return { success: true, messages: resultMessages };
    }

    //if(ID)
    const populatedMessages = await Promise.all(
      filteredMessages.map(async (message) => {
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: message.contentModel,
          select: "",
          options: { strictPopulate: false }
        });
        return populatedMessage;
      })
    );

    return { success: true, populatedMessages };
  } catch (error) {
    console.error("Error searching messages: ", error);
    throw error;
  }
}
