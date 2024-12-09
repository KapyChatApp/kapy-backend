/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message, { IMessage } from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import {
  FileContent,
  MessageBoxDTO,
  MessageBoxGroupDTO,
  RequestSendMessageDTO,
  ResponseAMessageBoxDTO,
  DetailMessageBoxDTO,
  ResponseMessageBoxDTO,
  ResponseMessageDTO,
  ResponseMessageManageDTO,
  PusherDelete,
  PusherRevoke,
  TextingEvent
} from "@/dtos/MessageDTO";
import mongoose, { Schema, Types } from "mongoose";
import User from "@/database/user.model";
import MessageBox from "@/database/message-box.model";
import formidable from "formidable";
import cloudinary from "@/cloudinary";
import File from "@/database/file.model";
import { pusherServer } from "../pusher";
import Relation from "@/database/relation.model";
import { boolean } from "zod";

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
        resource_type: "auto",
        public_id: `Audios/${file.originalFilename}`,
        folder: "Audios"
      });
      type = "Audio";
    } else {
      result = await cloudinary.uploader.upload(file.filepath, {
        resource_type: "raw",
        public_id: `Documents/${file.originalFilename}`,
        folder: "Documents"
      });
      type = "Other";
    }

    const createdFile = await File.create({
      fileName:
        type === "Other" ? file.originalFilename : generateRandomString(),
      url: result.url,
      publicId: result.public_id,
      bytes: result.bytes,
      width: result.width || "0",
      height: result.height || "0",
      format: result.type || "unknown",
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
  userId: string,
  membersIds: string[]
) {
  let contentIds: mongoose.Types.ObjectId[] = [];
  const userObjectId = new Types.ObjectId(userId);
  let text: string[] = [];

  if (typeof data.content === "string") {
    text = [data.content];
  } else if (
    data.content &&
    data.content.fileName &&
    data.content.format &&
    data.content.type
  ) {
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

  const visibilityMap = new Map();
  membersIds.forEach((member) => {
    visibilityMap.set(member.toString(), true); // Gán true cho tất cả userId
  });
  // Tạo tin nhắn
  const message = await Message.create({
    flag: true,
    visibility: visibilityMap,
    readedId: [userId],
    contentId: contentIds,
    text: text,
    boxId: new Types.ObjectId(data.boxId),
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
        const membersIds: string[] = [
          ...receiverIdsArray.map((id: { toString: () => any }) =>
            id.toString()
          ),
          detailBox.senderId.toString()
        ];
        const leaderExists = membersIds.includes(userId);
        if (!leaderExists) {
          throw new Error("UserId must be in MembersId list");
        }

        const message = await createContent(data, files, userId, membersIds);
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

        const pusherMessage: ResponseMessageDTO = {
          id: populatedMessage._id.toString(),
          flag: true,
          isReact: false,
          readedId: populatedMessage.readedId.map((id: any) => id.toString()),
          contentId:
            populatedMessage.contentId[populatedMessage.contentId.length - 1],
          text: populatedMessage.text[populatedMessage.text.length - 1],
          boxId: data.boxId,
          // Chuyển ObjectId sang chuỗi
          createAt: new Date().toISOString(), // ISO string đã hợp lệ
          createBy: populatedMessage.createBy.toString()
        };

        await pusherServer
          .trigger(`private-${data.boxId}`, "new-message", pusherMessage)
          .then(() => console.log("Message sent successfully: ", pusherMessage))
          .catch((error) => console.error("Failed to send message:", error));
        //return { success: true, populatedMessage, detailBox };
        return { success: true, message: "Send successfully" };
      } else {
        const [stUserId, ndUserId] = [receiverIdsArray[0], userId].sort();
        const relationBlock = await Relation.findOne({
          stUser: stUserId,
          ndUser: ndUserId,
          relation: "block"
        });
        if (relationBlock) {
          throw new Error("Sender is blocked by Receiver");
        }
        const membersIds: string[] = [
          ...receiverIdsArray.map((id: { toString: () => any }) =>
            id.toString()
          ),
          detailBox.senderId.toString()
        ];
        const message = await createContent(data, files, userId, membersIds);
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
          contentId:
            populatedMessage.contentId[populatedMessage.contentId.length - 1],
          text: populatedMessage.text[populatedMessage.text.length - 1],
          boxId: data.boxId,
          // Chuyển ObjectId sang chuỗi
          createAt: new Date().toISOString(), // ISO string đã hợp lệ
          createBy: populatedMessage.createBy.toString()
        };

        await pusherServer
          .trigger(`private-${data.boxId}`, "new-message", pusherMessage)
          .then(() => console.log("Message sent successfully: ", pusherMessage))
          .catch((error) => console.error("Failed to send message:", error));

        // return { success: true, populatedMessage, detailBox };
        return { success: true, message: "Send successfully" };
      }
    } else {
      const message = await createContent(data, files, userId, [
        userId,
        data.boxId
      ]);
      const populatedMessage = await Message.findById(message._id).populate({
        path: "contentId",
        model: "File",
        select: "",
        options: { strictPopulate: false }
      });
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
      const pusherMessage: ResponseMessageDTO = {
        id: populatedMessage._id.toString(),
        flag: true,
        isReact: false,
        readedId: populatedMessage.readedId.map((id: any) => id.toString()),
        contentId:
          populatedMessage.contentId[populatedMessage.contentId.length - 1],
        text: populatedMessage.text[populatedMessage.text.length - 1],
        boxId: data.boxId,
        // Chuyển ObjectId sang chuỗi
        createAt: new Date().toISOString(), // ISO string đã hợp lệ
        createBy: populatedMessage.createBy.toString()
      };

      await pusherServer
        .trigger(`private-${userId}`, "new-message", pusherMessage)
        .then(() => console.log("Message sent successfully: ", pusherMessage))
        .catch((error) => console.error("Failed to send message:", error));
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

    const message = await Message.findOne({
      _id: messageId,
      [`visibility.${userId}`]: true,
      flag: true
    });

    if (!message) {
      throw new Error("Message not found");
    }
    if (message.createBy.toString() === userId) {
      if (message.text !== "" && message.contentId.length === 0) {
        message.text.push(newContent);
        message.updatedAt = new Date();
        await message.save();
        const updatedMessage = await Message.findById(message._id).populate(
          "contentId"
        );
        const editedMessage: ResponseMessageDTO = {
          id: updatedMessage._id.toString(),
          flag: true,
          isReact: false,
          readedId: updatedMessage.readedId.map((id: any) => id.toString()),
          contentId:
            updatedMessage.contentId[updatedMessage.contentId.length - 1],
          text: newContent,
          boxId: updatedMessage.boxId.toString(),
          // Chuyển ObjectId sang chuỗi
          createAt: updatedMessage.createAt,
          createBy: updatedMessage.createBy.toString()
        };
        return { success: true, editedMessage };
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
      message.flag = false;

      await message.save();
      const pusherMessage: PusherRevoke = {
        id: message._id.toString(),
        flag: message.flag,
        isReact: message.isReact,
        text: "Message revoked",
        boxId: message.boxId.toString(),
        action: "revoke",
        createAt: new Date().toISOString(),
        createBy: userId
      };

      await pusherServer
        .trigger(`private-${message.boxId}`, "revoke-message", pusherMessage)
        .then(() =>
          console.log("Message revoked successfully: ", pusherMessage)
        )
        .catch((error) => console.error("Failed to revoke message:", error));
      return { success: true, message: "Message revoked" };
    } else if (action == "delete") {
      message.visibility.set(userId, false);
      await message.save();
      const pusherMessage: PusherDelete = {
        id: message._id.toString(),
        flag: message.flag,
        visibility: false,
        isReact: message.isReact,
        text: "Message deleted",
        boxId: message.boxId.toString(),
        action: "delete",
        createAt: new Date().toISOString(),
        createBy: userId
      };

      await pusherServer
        .trigger(`private-${message.boxId}`, "delete-message", pusherMessage)
        .then(() =>
          console.log("Message deleted successfully: ", pusherMessage)
        )
        .catch((error) => console.error("Failed to delete message:", error));
      return { success: true, message: "Message deleted" };
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error deleting or recalling message: ", error);
    throw error;
  }
}

export async function fetchMessage(boxId: string, userId: string) {
  try {
    await connectToDatabase();

    // Tìm kiếm MessageBox và populate các messageIds
    const messageBox = await MessageBox.findById(boxId).populate("messageIds");

    if (!messageBox) {
      throw new Error("MessageBox not found");
    }

    // Lọc các tin nhắn có visibility là true đối với userId
    const messagesWithContent: ResponseMessageDTO[] = await Promise.all(
      messageBox.messageIds.map(async (messageId: any) => {
        // Tìm tin nhắn với messageId và kiểm tra visibility của userId
        const message = await Message.findOne({
          _id: messageId,
          [`visibility.${userId}`]: true // Kiểm tra visibility của userId
        });

        if (!message) {
          // Nếu không tìm thấy tin nhắn có visibility đúng, bỏ qua
          return null;
        }

        // Populate nội dung của tin nhắn
        const populatedMessage = await message.populate({
          path: "contentId",
          model: "File",
          select: "",
          options: { strictPopulate: false }
        });

        // Tạo DTO cho tin nhắn với nội dung đã populate
        const responseMessage: ResponseMessageDTO = {
          id: populatedMessage._id,
          flag: populatedMessage.flag,
          isReact: populatedMessage.isReact,
          readedId: populatedMessage.readedId,
          contentId: populatedMessage.flag
            ? populatedMessage.contentId[populatedMessage.contentId.length - 1]
            : undefined,
          text: populatedMessage.flag
            ? populatedMessage.text[populatedMessage.text.length - 1]
            : "Message revoked", // Nếu tin nhắn bị thu hồi
          boxId: populatedMessage.boxId.toString(),
          createAt: populatedMessage.createAt,
          createBy: populatedMessage.createBy
        };

        return responseMessage;
      })
    );

    // Lọc bỏ các tin nhắn không hợp lệ (null)
    const validMessages = messagesWithContent.filter(Boolean);

    return { success: true, messages: validMessages };
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
      _id: { $in: messageBox.messageIds },
      flag: true // Điều kiện để lọc những tin nhắn có flag là true
    })
      .populate({
        path: "contentId",
        model: "File",
        select: "",
        options: { strictPopulate: false }
      })
      .exec();
    if (messages.length === 0) {
      return { success: false, messages: [] };
    }
    // Lọc tin nhắn có visibility toàn bộ là true
    const filteredMessages = messages.filter((message) => {
      return Array.from(message.visibility.values()).every(
        (value) => value === true
      );
    });

    const resultMessages: ResponseMessageDTO[] = filteredMessages
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
        boxId: message.boxId.toString(),
        createAt: message.createAt,
        createBy: message.createBy
      }));

    return { success: true, messages: resultMessages };
  } catch (error) {
    console.error("Error searching messages: ", error);
    throw error;
  }
}

export async function textingEvent(boxId: string, userId: string) {
  try {
    const pusherTexting: TextingEvent = {
      boxId: boxId,
      userId: userId,
      texting: true
    };

    await pusherServer
      .trigger(`private-${boxId}`, "texting-status", pusherTexting)
      .then(() => console.log("User is texting...", pusherTexting))
      .catch((error) => console.error("Failed to create event: ", error));
    return pusherTexting;
  } catch (error) {
    console.error("Error to create event: ", error);
    throw error;
  }
}

export async function disableTextingEvent(boxId: string, userId: string) {
  try {
    const pusherTexting: TextingEvent = {
      boxId: boxId,
      userId: userId,
      texting: false
    };

    await pusherServer
      .trigger(`private-${boxId}`, "disable-texting-status", pusherTexting)
      .then(() => console.log("User is not texting...", pusherTexting))
      .catch((error) => console.error("Failed to create event: ", error));
    return pusherTexting;
  } catch (error) {
    console.error("Error to create event: ", error);
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

    const messageBoxes = await MessageBox.find({
      $and: [{ receiverIds: { $in: [userId] } }, { receiverIds: { $size: 2 } }]
    }).populate(
      "receiverIds",
      "firstName lastName nickName avatar phoneNumber"
    );

    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }

    // Xử lý từng box để lấy tin nhắn cuối và kiểm tra trạng thái đọc
    const messageBoxesWithDetails: MessageBoxDTO[] = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lọc những messageIds có visibility của userId là true
        const filteredMessageIds = await Promise.all(
          messageBox.messageIds.map(async (messageId: any) => {
            const message = await Message.findById(messageId).select(
              "visibility"
            );
            return message?.visibility?.get(userId) === true ? messageId : null;
          })
        );

        // Lọc bỏ các null values trong mảng
        const validMessageIds = filteredMessageIds.filter((id) => id !== null);

        // Lấy tin nhắn cuối cùng từ danh sách hợp lệ
        const lastMessageId = validMessageIds[validMessageIds.length - 1];

        if (!lastMessageId) {
          return {
            ...messageBox.toObject(),
            lastMessage: null,
            readStatus: false
          };
        }

        // Lấy thông tin tin nhắn cuối
        const lastMessage = await Message.findById(lastMessageId).populate({
          path: "contentId",
          model: "File",
          options: { strictPopulate: false }
        });

        if (!lastMessage) {
          return {
            ...messageBox.toObject(),
            lastMessage: null,
            readStatus: false
          };
        }

        // Kiểm tra trạng thái đã đọc
        const isRead = lastMessage.readedId.includes(userId);
        const readStatus = isRead ? true : false;

        const responseLastMessage: ResponseMessageDTO = {
          id: lastMessage._id,
          flag: lastMessage.flag,
          isReact: lastMessage.isReact,
          readedId: lastMessage.readedId,
          contentId: lastMessage.flag
            ? lastMessage.contentId[lastMessage.contentId.length - 1]
            : undefined,
          text: lastMessage.flag
            ? lastMessage.text[lastMessage.text.length - 1]
            : "Message revoked",
          boxId: lastMessage.boxId.toString(),
          createAt: lastMessage.createAt,
          createBy: lastMessage.createBy
        };

        return {
          ...messageBox.toObject(),
          responseLastMessage,
          readStatus
        };
      })
    );

    return {
      success: true,
      box: messageBoxesWithDetails,
      adminId: userId
    };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function fetchOneBoxChat(boxId: string, userId: string) {
  try {
    await connectToDatabase();

    // Tìm messageBox theo boxId
    const messageBox = await MessageBox.findById(boxId)
      .populate("senderId", "firstName lastName nickName avatar phoneNumber")
      .populate(
        "receiverIds",
        "firstName lastName nickName avatar phoneNumber"
      );

    if (!messageBox) {
      return {
        success: false,
        message: "No message boxes found for this boxId"
      };
    }
    // Lấy tin nhắn cuối cùng
    const lastMessageId =
      messageBox.messageIds[messageBox.messageIds.length - 1];

    if (!lastMessageId) {
      return {
        box: {
          ...messageBox.toObject(),
          readStatus: false // Không có tin nhắn thì mặc định là chưa đọc
        }
      };
    }

    // Tìm tin nhắn cuối cùng
    const lastMessage = await Message.findById(lastMessageId).populate({
      path: "contentId",
      model: "File",
      select: ""
    });

    if (!lastMessage) {
      return {
        box: {
          ...messageBox.toObject(),
          readStatus: false // Không có tin nhắn thì mặc định là chưa đọc
        }
      };
    }

    // Kiểm tra trạng thái đã đọc
    const readStatus = lastMessage.readedId.includes(userId);

    return {
      box: {
        ...messageBox.toObject(),
        readStatus // Thêm readStatus vào messageBox
      }
    };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function fetchBoxGroup(userId: string) {
  try {
    await connectToDatabase();

    // Lấy danh sách các nhóm chat
    const messageBoxes = await MessageBox.find({
      $and: [
        { receiverIds: { $in: [userId] } },
        {
          $expr: { $gt: [{ $size: "$receiverIds" }, 2] }
        }
      ]
    })
      .populate("receiverIds", "firstName lastName nickName avatar phoneNumber")
      .populate("senderId", "firstName lastName nickName avatar phoneNumber");

    console.log(messageBoxes);

    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }

    // Xử lý nội dung từng nhóm
    const messageBoxesWithContent: MessageBoxGroupDTO[] = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lọc những messageIds có visibility của userId là true
        const filteredMessageIds = await Promise.all(
          messageBox.messageIds.map(async (messageId: any) => {
            const message = await Message.findById(messageId).select(
              "visibility"
            );
            return message?.visibility?.get(userId) === true ? messageId : null;
          })
        );

        // Lọc bỏ các giá trị null
        const validMessageIds = filteredMessageIds.filter((id) => id !== null);

        // Lấy tin nhắn cuối cùng
        const lastMessageId = validMessageIds[validMessageIds.length - 1];

        if (!lastMessageId) {
          return {
            ...messageBox.toObject(),
            lastMessage: null,
            readStatus: false
          };
        }

        // Lấy tin nhắn cuối cùng với đầy đủ thông tin
        const populatedMessage = await Message.findById(lastMessageId).populate(
          {
            path: "contentId",
            model: "File",
            select: ""
          }
        );

        if (!populatedMessage) {
          return {
            ...messageBox.toObject(),
            lastMessage: null,
            readStatus: false
          };
        }

        // Kiểm tra trạng thái đã đọc
        const readStatus = populatedMessage.readedId.includes(userId);
        const responseLastMessage: ResponseMessageDTO = {
          id: populatedMessage._id,
          flag: populatedMessage.flag,
          isReact: populatedMessage.isReact,
          readedId: populatedMessage.readedId,
          contentId: populatedMessage.flag
            ? populatedMessage.contentId[populatedMessage.contentId.length - 1]
            : undefined,
          text: populatedMessage.flag
            ? populatedMessage.text[populatedMessage.text.length - 1]
            : "Message revoked",
          boxId: populatedMessage.boxId.toString(),
          createAt: populatedMessage.createAt,
          createBy: populatedMessage.createBy
        };

        return {
          ...messageBox.toObject(),
          lastMessage: responseLastMessage,
          readStatus
        };
      })
    );

    return { success: true, box: messageBoxesWithContent, adminId: userId };
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
}

export async function getFileList(boxId: string) {
  try {
    await connectToDatabase();
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox || !messageBox.messageIds) {
      throw new Error("MessageBox not found or has no messages");
    }

    const messages = await Message.find({
      _id: { $in: messageBox.messageIds },
      flag: true // Lọc flag là true
    })
      .select("contentId visibility")
      .exec();

    if (messages.length === 0) {
      return [];
    }
    const filteredMessages = messages.filter((message) => {
      // Kiểm tra tất cả giá trị trong `visibility` là true
      return Array.from(message.visibility.values()).every(
        (value) => value === true
      );
    });

    const fileIds = filteredMessages.flatMap((msg: any) => msg.contentId);

    const fileContent: FileContent[] = await File.find({
      _id: { $in: fileIds }
    }).exec();

    return fileContent;
  } catch (error) {
    console.error("Error get image list: ", error);
    throw error;
  }
}

//MANAGEMENT
export async function getAllMessage() {
  try {
    await connectToDatabase();
    const allMessages = await Message.find();

    const messagesWithContent: ResponseMessageManageDTO[] = await Promise.all(
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
      const populatedMessages: ResponseMessageManageDTO[] = await Promise.all(
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
    const populatedMessages: ResponseMessageManageDTO[] = await Promise.all(
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
