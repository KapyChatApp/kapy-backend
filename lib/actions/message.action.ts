/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import {
  FileContent,
  MessageBoxDTO,
  MessageBoxGroupDTO,
  RequestSendMessageDTO,
  ResponseAMessageBoxDTO,
  ResponseMessageBoxDTO,
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
      width: result.width || "0",
      height: result.height || "0",
      format: result.format || "unknown",
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
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: "File",
          select: "",
          options: { strictPopulate: false }
        });
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

        //return { success: true, populatedMessage, detailBox };
        return { success: true, message: "Send successfully" };
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
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: "File",
          select: "",
          options: { strictPopulate: false }
        });

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

        await pusherServer
          .trigger(`private-${data.boxId}`, "new-message", pusherMessage)
          .then(() => console.log("Message sent successfully"))
          .catch((error) => console.error("Failed to send message:", error));

        // return { success: true, populatedMessage, detailBox };
        return { success: true, message: "Send successfully" };
      }
    } else {
      const message = await createContent(data, files, userId);
      detailBox = await MessageBox.create({
        senderId: userId,
        receiverIds: [data.boxId, userId],
        messageIds: [message._id],
        groupName: "",
        groupAva: "",
        flag: true,
        pin: false,
        createBy: userObjectId
      });
      return { success: true, message: "Create new box and send successfully" };
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
  // return { success: true, messageBoxId: messageBox._id, messageBox };
  return { success: true, message: "Create group successfully" };
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
    if (message.createBy.toString() === userId) {
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

    const messagesWithContent: ResponseMessageDTO[] = await Promise.all(
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

        const responseMessage: ResponseMessageDTO = {
          id: populatedMessage._id,
          flag: populatedMessage.flag,
          isReact: populatedMessage.isReact,
          readedId: populatedMessage.readedId,
          contentId: populatedMessage.contentId,
          text: populatedMessage.text,
          createAt: populatedMessage.createAt,
          createBy: populatedMessage.createBy
        };

        return responseMessage;
      })
    );

    return { success: true, messages: messagesWithContent };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function checkMarkMessageAsRead(boxIds: string[], userId: string) {
  try {
    // Kết nối cơ sở dữ liệu
    await connectToDatabase();

    // Kiểm tra nếu user tồn tại
    const userExists = await User.findById(userId);
    if (!userExists) {
      throw new Error("User does not exist");
    }

    // Kiểm tra trạng thái từng `boxId`
    const results = await Promise.all(
      boxIds.map(async (boxId) => {
        try {
          // Tìm MessageBox theo `boxId`
          const messageBox = await MessageBox.findById(boxId).populate(
            "messageIds"
          );

          if (!messageBox) {
            return { boxId, success: false, message: "Box not found" };
          }

          if (messageBox.messageIds.length === 0) {
            return { boxId, success: false, message: "No messages in the box" };
          }

          // Lấy tin nhắn cuối cùng trong box
          const lastMessage =
            messageBox.messageIds[messageBox.messageIds.length - 1];

          // Kiểm tra xem người dùng đã đọc tin nhắn cuối cùng chưa
          if (lastMessage.readedId.includes(userId)) {
            return { boxId, success: true, message: "Message already read" };
          } else {
            return { boxId, success: false, message: "Message not read yet" };
          }
        } catch (error) {
          console.error(`Error processing box ${boxId}:`, error);
          return { boxId, success: false, message: "Error processing box" };
        }
      })
    );
    console.log(results);
    return results;
  } catch (error) {
    console.error("Error checking message read status: ", error);
    throw error;
  }
}

export async function markMessageAsRead(boxId: string, userId: string) {
  try {
    await connectToDatabase();

    const messageBox = await MessageBox.findById(boxId).populate("messageIds");
    if (!messageBox) {
      throw new Error("Box not found");
    }
    if (messageBox.messageIds.length === 0) {
      return null;
    }

    // Kiểm tra nếu user tồn tại
    const userExists = await User.findById(userId);
    if (!userExists) {
      throw new Error("User does not exist");
    }

    const lastMessage = messageBox.messageIds[messageBox.messageIds.length - 1];

    // Kiểm tra nếu user chưa đọc message cuối cùng
    if (!lastMessage.readedId.includes(userId)) {
      // Cập nhật tất cả message trong box với userId
      await Promise.all(
        messageBox.messageIds.map(async (messageId: any) => {
          const message = await Message.findById(messageId);
          if (message && !message.readedId.includes(userId)) {
            message.readedId.push(userId);
            await message.save();
          }
        })
      );

      return {
        success: true,
        messages: "Messages marked as read"
      };
    } else {
      return {
        success: true,
        lastMessage,
        messages: "Messages already read"
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
    }).populate({
      path: "contentId",
      model: "File",
      select: "",
      options: { strictPopulate: false }
    });

    const resultMessages: ResponseMessageDTO[] = messages
      .filter((message) => {
        let content: string = "";
        if (message.text.length > 0 && message.contentId.length === 0) {
          content = message.text[message.text.length - 1];
        } else {
          const contentId = message.contentId[message.contentId.length - 1];
          if ("fileName" in contentId) {
            // contentId là FileContent
            content = contentId.fileName;
          } else if ("description" in contentId) {
            // contentId là GPSContent
            content = contentId.description ? contentId.description : "";
          }
        }
        return content
          .toLowerCase()
          .trim()
          .includes(query.toLowerCase().trim());
      })
      .map((message) => ({
        id: message._id,
        flag: message.flag,
        isReact: message.isReact,
        readedId: message.readedId,
        contentId: message.contentId,
        text: message.text,
        createAt: message.createAt,
        createBy: message.createBy
      }));

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

    const messageBoxResponse: ResponseAMessageBoxDTO = {
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
    const messageBoxesWithContent: MessageBoxDTO[] = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lấy messageId cuối cùng
        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];

        if (!lastMessageId) {
          return messageBox; // Nếu không có messageId nào, trả về messageBox gốc
        }

        // Tìm message theo messageId cuối cùng
        const message = await Message.findById(lastMessageId);
        populatedMessage = await Message.findById(lastMessageId).populate({
          path: "contentId",
          model: "File",
          select: "",
          options: { strictPopulate: false }
        });
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
      .populate("receiverIds");
    // .populate({
    //   path: "messageIds",
    //   populate: {
    //     path: "contentId",
    //     model: "File",
    //     select: "",
    //     options: { strictPopulate: false }
    //   }
    // });
    if (!messageBox) {
      return {
        success: false,
        message: "No message boxes found for this userId"
      };
    }

    return { box: messageBox };
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
    const messageBoxesWithContent: MessageBoxGroupDTO[] = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lấy messageId cuối cùng
        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];

        if (!lastMessageId) {
          return messageBox; // Nếu không có messageId nào, trả về messageBox gốc
        }

        // Tìm message theo messageId cuối cùng
        const message = await Message.findById(lastMessageId);
        populatedMessage = await Message.findById(lastMessageId).populate({
          path: "contentId",
          model: "File",
          select: ""
        });

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

export async function getImageList(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox || !messageBox.messageIds) {
      throw new Error("MessageBox not found or has no messages");
    }

    const messages = await Message.find({ _id: { $in: messageBox.messageIds } })
      .select("contentId")
      .exec();

    const fileIds = messages.flatMap((msg: any) => msg.contentId);

    const imageFiles = await File.find({
      _id: { $in: fileIds },
      type: "Image"
    }).exec();

    return imageFiles;
  } catch (error) {
    console.error("Error get image list: ", error);
    throw error;
  }
}

export async function getVideoList(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox || !messageBox.messageIds) {
      throw new Error("MessageBox not found or has no messages");
    }

    const messages = await Message.find({ _id: { $in: messageBox.messageIds } })
      .select("contentId")
      .exec();

    const fileIds = messages.flatMap((msg: any) => msg.contentId);

    const imageFiles = await File.find({
      _id: { $in: fileIds },
      type: "Video"
    }).exec();

    return imageFiles;
  } catch (error) {
    console.error("Error get video list: ", error);
    throw error;
  }
}

export async function getAudioList(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox || !messageBox.messageIds) {
      throw new Error("MessageBox not found or has no messages");
    }

    const messages = await Message.find({ _id: { $in: messageBox.messageIds } })
      .select("contentId")
      .exec();

    const fileIds = messages.flatMap((msg: any) => msg.contentId);

    const imageFiles = await File.find({
      _id: { $in: fileIds },
      type: "Audio"
    }).exec();

    return imageFiles;
  } catch (error) {
    console.error("Error get audio list: ", error);
    throw error;
  }
}

export async function getOtherList(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox || !messageBox.messageIds) {
      throw new Error("MessageBox not found or has no messages");
    }

    const messages = await Message.find({ _id: { $in: messageBox.messageIds } })
      .select("contentId")
      .exec();

    const fileIds = messages.flatMap((msg: any) => msg.contentId);

    const imageFiles = await File.find({
      _id: { $in: fileIds },
      type: "Other"
    }).exec();

    return imageFiles;
  } catch (error) {
    console.error("Error get other list: ", error);
    throw error;
  }
}

//MANAGEMENT
export async function getAllMessage() {
  try {
    await connectToDatabase();
    const allMessages = await Message.find();

    const messagesWithContent: ResponseMessageDTO[] = await Promise.all(
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
      const populatedMessages: ResponseMessageDTO[] = await Promise.all(
        messages.map(async (message) => {
          const populatedMessage = await Message.findById(message._id).populate(
            {
              path: "contentId",
              model: "File",
              select: "",
              options: { strictPopulate: false }
            }
          );
          return populatedMessage;
        })
      );

      const resultMessages = populatedMessages.filter((populatedMessage) => {
        let content: string = "";
        if (
          populatedMessage.text.length > 0 &&
          populatedMessage.contentId.length === 0
        ) {
          content = populatedMessage.text[populatedMessage.text.length - 1];
        } else {
          const contentId =
            populatedMessage.contentId[populatedMessage.contentId.length - 1];
          if ("fileName" in contentId) {
            // contentId là FileContent
            content = contentId.fileName;
          } else if ("description" in contentId) {
            // contentId là GPSContent
            content = contentId.description ? contentId.description : "";
          }
        }
        return content
          .toLowerCase()
          .trim()
          .includes(query.toLowerCase().trim());
      });

      if (resultMessages.length === 0) {
        return { success: false, messages: [] };
      }

      return { success: true, messages: resultMessages };
    }

    //if(ID)
    const populatedMessages: ResponseMessageDTO[] = await Promise.all(
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
