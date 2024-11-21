/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import {
  MessageBoxResponseDTO,
  RequestSendMessageDTO,
  ResponseMessageDTO
} from "@/dtos/MessageDTO";
import mongoose, { Schema, Types } from "mongoose";
import User from "@/database/user.model";
import MessageBox from "@/database/message-box.model";
import formidable from "formidable";
import cloudinary from "@/cloudinary";
import File from "@/database/file.model";
import { pusherServer } from "../pusher";
import Relation from "@/database/relation.model";

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

async function createContent(
  data: RequestSendMessageDTO,
  files: formidable.Files,
  userId: string
) {
  let contentIds: mongoose.Types.ObjectId[] = [];
  const userObjectId = new Types.ObjectId(userId);
  let text: string[] = [];

  if (typeof data.content === "string") {
    text = [data.content];
  } else if (["image", "audio", "video", "other"].includes(data.content.type)) {
    if (files.file) {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const createdFile = await createFile(file, userId);
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
    readedId: [userId],
    contentId: contentIds,
    text: text,
    createAt: Date.now(),
    updatedAt: Date.now(),
    createBy: userObjectId
  });

  return message;
}

export async function createMessage(
  data: RequestSendMessageDTO,
  files: formidable.Files,
  userId: string
) {
  try {
    await connectToDatabase();
    const userObjectId = new Types.ObjectId(userId);

    // eslint-disable-next-line prefer-const
    let detailBox = await MessageBox.findById(data.boxId);
    if (detailBox) {
      const receiverIdsArray = detailBox.receiverIds;

      if (receiverIdsArray.length > 2) {
        const membersIds = [
          ...receiverIdsArray.map((id: { toString: () => any }) =>
            id.toString()
          ),
          detailBox.senderId.toString()
        ];
        const leaderExists = membersIds.includes(userId);
        if (!leaderExists) {
          throw new Error("UserId must be in MembersId list");
        }

        const message = await createContent(data, files, userId);
        const populatedMessage = await Message.findById(message._id).populate(
          "contentId"
        );
        detailBox = await MessageBox.findByIdAndUpdate(
          data.boxId,
          {
            $push: { messageIds: message._id },
            $set: { senderId: userId }
          },
          { new: true }
        );
        if (!detailBox) {
          throw new Error("Group MessageBox cannot update");
        }

        return { success: true, populatedMessage, detailBox };
      } else {
        // const [stUserId, ndUserId] = [receiverIdsArray[0], userId].sort();
        // const relationBlock = await Relation.findOne({
        //   stUser: stUserId,
        //   ndUser: ndUserId,
        //   relation: "block"
        // });
        // if (relationBlock) {
        //   throw new Error("Sender is blocked by Receiver");
        // }
        const message = await createContent(data, files, userId);
        detailBox = await MessageBox.findByIdAndUpdate(
          detailBox._id,
          {
            $push: { messageIds: message._id },
            $set: { senderId: userId },
            $addToSet: { receiverIds: userId }
          },
          { new: true }
        );
        const populatedMessage = await Message.findById(message._id).populate(
          "contentId"
        );

        const pusherMessage: ResponseMessageDTO = {
          id: populatedMessage._id.toString(),
          flag: true,
          isReact: false,
          readedId: populatedMessage.readedId.map((id: any) => id.toString()),
          contentId: populatedMessage.contentId,
          text: populatedMessage.text,
          // Chuyển ObjectId sang chuỗi
          createAt: populatedMessage.createAt, // ISO string đã hợp lệ
          createBy: populatedMessage.createBy.toString()
        };

        console.log("Message data before trigger:", pusherMessage);

        await pusherServer
          .trigger(`private-${data.boxId}`, "new-message", pusherMessage)
          .then(() => console.log("Message sent successfully"))
          .catch((error) => console.error("Failed to send message:", error));

        return { success: true, populatedMessage, detailBox };
      }
    } else {
      detailBox = await MessageBox.create({
        senderId: userId,
        receiverIds: [userId],
        messageIds: [],
        groupName: "",
        groupAva: "",
        flag: true,
        pin: false,
        createBy: userObjectId
      });
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
  const existMessageBox = await MessageBox.findOne({
    receiverIds: { $all: membersIds }
  });

  if (existMessageBox) {
    return {
      success: true,
      messageBoxId: existMessageBox._id,
      existMessageBox
    };
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
          model: "File",
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

export async function getAMessageBox(
  boxId: string | undefined,
  userId: string
) {
  try {
    connectToDatabase();

    const messageBox = await MessageBox.findById(boxId)
      .populate("receiverIds", "firstName lastName avatar _id")
      .populate("messageIds");

    const messageBoxResponse: MessageBoxResponseDTO = {
      _id: messageBox._id,
      name:
        messageBox.receiverIds.length > 2
          ? messageBox.groupName
          : messageBox.senderId.toString() === userId
          ? messageBox.receiverIds[1].firstName +
            " " +
            messageBox.receiverIds[1].lastName
          : messageBox.receiverIds[0].firstName +
            " " +
            messageBox.receiverIds[0].lastName,
      avatar:
        messageBox.receiverIds.length > 2
          ? messageBox.groupAva
          : messageBox.senderId.toString() === userId
          ? messageBox.receiverIds[1].avatar
          : messageBox.receiverIds[0].avatar,
      messages: messageBox.messageIds,
      receiverId:
        messageBox.senderId.toString() === userId
          ? messageBox.receiverIds[1]._id
          : messageBox.receiverIds[0]._id
    };
    return messageBoxResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchBoxChat(userId: string) {
  try {
    await connectToDatabase();
    let populatedMessage;
    const messageBoxes = await MessageBox.find({
      $and: [{ receiverIds: { $in: [userId] } }, { receiverIds: { $size: 2 } }]
    }).populate("receiverIds", "firstName lastName avatar phoneNumber");
    // .populate("senderId", "nickName")
    // .populate("receiverIds", "fullName avatar")
    // .populate("messageIds");
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
        populatedMessage = await Message.findById(lastMessageId).populate(
          "contentId"
        );
        // .populate("readedId");

        if (populatedMessage && populatedMessage.contentId) {
          return {
            ...messageBox.toObject(),
            lastMessage: populatedMessage
          };
        }

        return messageBox;
      })
    );
    return {
      success: true,
      box: messageBoxesWithContent,
      adminId: userId
    };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function fetchOneBoxChat(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId)
      .populate("senderId")
      .populate("receiverIds")
      .populate({
        path: "messageIds", // Populate tất cả các tin nhắn trong messageIds
        populate: {
          path: "contentId", // Populate contentId cho từng tin nhắn
          model: "File", // Model File sẽ được tham chiếu
          select: "", // Chọn các trường cần thiết từ model File
          options: { strictPopulate: false }
        }
      });
    if (!messageBox) {
      return {
        success: false,
        message: "No message boxes found for this userId"
      };
    }

    return { success: true, box: messageBox };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function fetchBoxGroup(userId: string) {
  try {
    let populatedMessage;
    await connectToDatabase();
    const messageBoxes = await MessageBox.find({
      $and: [
        { receiverIds: { $in: [userId] } },
        {
          $expr: { $gt: [{ $size: "$receiverIds" }, 2] }
        }
      ]
    })
      .populate("receiverIds", "firstName lastName")
      .populate("senderId", "firstName lastName");
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
        populatedMessage = await Message.findById(lastMessageId).populate(
          "contentId"
        );

        if (populatedMessage && populatedMessage.contentId) {
          return {
            ...messageBox.toObject(),
            lastMessage: populatedMessage
          };
        }

        return messageBox;
      })
    );
    return { success: true, box: messageBoxesWithContent, adminId: userId };
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
          .model("File")
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

    if (query) {
      const populatedMessages = await Promise.all(
        messages.map(async (message) => {
          const populatedMessage = await Message.findById(message._id).populate(
            {
              path: "contentId",
              model: "File",
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
      messages.map(async (message) => {
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: "File",
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
