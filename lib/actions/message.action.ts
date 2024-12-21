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
  ResponseMessageDTO,
  ResponseMessageManageDTO,
  PusherDelete,
  PusherRevoke,
  TextingEvent,
  ResponseReactMessageDTO
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
import swaggerJSDoc from "swagger-jsdoc";
import { createFile } from "./file.action";

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

      //Message in group
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
          isReact: [],
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
      }
      //Message private
      else if (receiverIdsArray.length === 2) {
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
          isReact: [],
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
      //Message stranger
      else {
        if (!detailBox.receiverIds.includes(userId)) {
          const membersIds: string[] = [
            ...receiverIdsArray.map((id: { toString: () => any }) =>
              id.toString()
            ),
            userId
          ];
          const message = await createContent(data, files, userId, membersIds);
          // Cập nhật boxId mới
          const newBox = await MessageBox.create({
            senderId: detailBox.senderId,
            receiverIds: [...detailBox.receiverIds, data.boxId], // Thêm ID người nhận vào
            messageIds: [...detailBox.messageIds, message._id], // Chuyển tin nhắn
            groupName: detailBox.groupName,
            groupAva: detailBox.groupAva,
            flag: detailBox.flag,
            pin: detailBox.pin,
            createBy: detailBox.createBy
          });

          // Cập nhật lại `detailBox`
          detailBox = newBox;

          // Xóa MessageBox cũ
          await MessageBox.deleteOne({ _id: data.boxId });

          const populatedMessage = await Message.findById(message._id).populate(
            {
              path: "contentId",
              model: "File",
              select: "",
              options: { strictPopulate: false }
            }
          );

          const pusherMessage: ResponseMessageDTO = {
            id: populatedMessage._id.toString(),
            flag: true,
            isReact: [],
            readedId: populatedMessage.readedId.map((id: any) => id.toString()),
            contentId:
              populatedMessage.contentId[populatedMessage.contentId.length - 1],
            text: populatedMessage.text[populatedMessage.text.length - 1],
            boxId: newBox._id,
            // Chuyển ObjectId sang chuỗi
            createAt: new Date().toISOString(), // ISO string đã hợp lệ
            createBy: populatedMessage.createBy.toString()
          };

          await pusherServer
            .trigger(`private-${userId}`, "new-message", pusherMessage)
            .then(() =>
              console.log("Message sent successfully: ", pusherMessage)
            )
            .catch((error) => console.error("Failed to send message:", error));

          // return { success: true, populatedMessage, detailBox };
          return {
            success: true,
            message: "Accept stranger and Send successfully"
          };
        } else {
          // Nếu người lạ gửi tin nhắn tiếp theo
          const membersIds: string[] = [
            ...receiverIdsArray.map((id: { toString: () => any }) =>
              id.toString()
            ),
            data.boxId
          ];
          const message = await createContent(data, files, userId, membersIds);
          //detailBox.messageIds.push(message._id);

          await MessageBox.findByIdAndUpdate(
            data.boxId, // ID của hộp tin nhắn
            { $push: { messageIds: message._id } }, // Thêm message._id vào mảng messageIds
            { new: true } // Trả về tài liệu đã được cập nhật (tuỳ chọn)
          );
          await detailBox.save();
          const populatedMessage = await Message.findById(message._id).populate(
            {
              path: "contentId",
              model: "File",
              select: "",
              options: { strictPopulate: false }
            }
          );

          const pusherMessage: ResponseMessageDTO = {
            id: populatedMessage._id.toString(),
            flag: true,
            isReact: [],
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
            .then(() =>
              console.log("Message sent successfully: ", pusherMessage)
            )
            .catch((error) => console.error("Failed to send message:", error));

          // return { success: true, populatedMessage, detailBox };

          return {
            success: true,
            message: "Continue to send from stranger successfully"
          };
        }
      }
    } else {
      // Người lạ gửi tin nhắn lần đầu
      const boxIdObjectId = new Types.ObjectId(data.boxId);
      detailBox = await MessageBox.create({
        _id: boxIdObjectId,
        senderId: userId, // Người gửi
        receiverIds: [userId], // Chỉ chứa ID của người gửi
        messageIds: [], // Tin nhắn trống ban đầu
        groupName: "",
        groupAva: "",
        flag: true,
        pin: false,
        createBy: userObjectId // ID người tạo
      });

      // Tạo tin nhắn mới
      const message = await createContent(data, files, userId, [
        userId,
        data.boxId
      ]);
      detailBox = await MessageBox.findByIdAndUpdate(
        boxIdObjectId,
        { $push: { messageIds: message._id } },
        { new: true } // Trả về box đã được cập nhật
      );
      const populatedMessage = await Message.findById(message._id).populate({
        path: "contentId",
        model: "File",
        select: "",
        options: { strictPopulate: false }
      });

      // Chuẩn bị dữ liệu phản hồi
      const pusherMessage: ResponseMessageDTO = {
        id: populatedMessage._id.toString(),
        flag: true,
        isReact: [],
        readedId: populatedMessage.readedId.map((id: any) => id.toString()),
        contentId:
          populatedMessage.contentId[populatedMessage.contentId.length - 1],
        text: populatedMessage.text[populatedMessage.text.length - 1],
        boxId: detailBox._id, // ID của box hiện tại (sau khi cập nhật)
        createAt: new Date().toISOString(),
        createBy: populatedMessage.createBy.toString()
      };

      // Gửi tin nhắn qua Pusher
      await pusherServer
        .trigger(`private-${detailBox._id}`, "new-message", pusherMessage)
        .then(() => console.log("Message sent successfully: ", pusherMessage))
        .catch((error) => console.error("Failed to send message:", error));

      return {
        success: true,
        message: "Message from stranger sent successfully"
      };
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
      message: "Box is existed.",
      existMessageBox
    };
  }

  const userObjectId = new Types.ObjectId(leaderId);
  const messageBox: MessageBoxDTO = await MessageBox.create({
    senderId: leaderId,
    receiverIds: [leaderId, ...membersIds],
    messageIds: [],
    groupName: groupName,
    groupAva: groupAva,
    flag: true,
    pin: false,
    createBy: userObjectId
  });
  // return { success: true, messageBoxId: messageBox._id, messageBox };
  return {
    success: true,
    message: "Create box chat successfully",
    newBox: messageBox
  };
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
          isReact: [],
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
      return { success: false, messages: [] };
    }

    // Lọc các tin nhắn có visibility là true đối với userId
    const messagesWithContent: ResponseMessageDTO[] = await Promise.all(
      messageBox.messageIds.map(async (messageId: any) => {
        // Tìm tin nhắn với messageId và kiểm tra visibility của userId
        const message = await Message.findOne({
          _id: messageId,
          [`visibility.${userId}`]: true // Kiểm tra visibility của userId
        });
        console.log("message: ", message);
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

export async function textingEvent(
  boxId: string,
  avatar: string,
  userId: string
) {
  try {
    const pusherTexting: TextingEvent = {
      boxId: boxId,
      userId: userId,
      avatar: avatar,
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

export async function disableTextingEvent(
  boxId: string,
  avatar: string,
  userId: string
) {
  try {
    const pusherTexting: TextingEvent = {
      boxId: boxId,
      userId: userId,
      avatar: avatar,
      texting: false
    };

    await pusherServer
      .trigger(`private-${boxId}`, "texting-status", pusherTexting)
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
      $or: [
        {
          $and: [
            { receiverIds: { $in: [userId] } },
            {
              $expr: { $lte: [{ $size: "$receiverIds" }, 2] }
            }
          ]
        },
        { _id: userId } // Hoặc ID của box là userId
      ]
    }).populate("receiverIds", "firstName lastName nickName avatar");

    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }

    // Xử lý từng box để trả về nội dung cần thiết
    const messageBoxesWithDetails: MessageBoxDTO[] = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        const [stUserId, ndUserId] = messageBox.receiverIds
          .map((user: { _id: any }) => user._id)
          .sort();

        const relationStranger = await Relation.findOne({
          stUser: stUserId,
          ndUser: ndUserId,
          relation: "stranger"
        });

        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];
        let readStatus = true;

        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            readStatus = lastMessage.readedId.includes(userId);
          }
        }

        return {
          _id: messageBox._id,
          senderId: messageBox.senderId,
          receiverIds: messageBox.receiverIds,
          groupName: messageBox.groupName || "",
          groupAva: messageBox.groupAva || "",
          flag: messageBox.flag || false,
          pin: messageBox.pin || false,
          readStatus,
          stranger: relationStranger ? true : false
        };
      })
    );

    return {
      success: true,
      box: messageBoxesWithDetails
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
      .populate("receiverIds", "firstName lastName nickName avatar")
      .populate("senderId", "firstName lastName nickName avatar");

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
        // Lấy tin nhắn cuối cùng
        const lastMessageId = messageBox.messageIds[messageBox.messageIds - 1];
        let readStatus = true;
        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            readStatus = lastMessage.readedId.includes(userId);
          }
        }

        return {
          _id: messageBox._id,
          senderId: messageBox.senderId,
          receiverIds: messageBox.receiverIds,
          groupName: messageBox.groupName || "",
          groupAva: messageBox.groupAva || "",
          flag: messageBox.flag || false,
          pin: messageBox.pin || false,
          readStatus
        };
      })
    );

    return { success: true, box: messageBoxesWithContent };
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
      return [];
    }

    const messages = await Message.find({
      _id: { $in: messageBox.messageIds },
      flag: true
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

export async function reactMessage(userId: string, messageId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    if (!message.isReact.includes(userId)) {
      message.isReact.push(userId);
    } else {
      message.isReact = message.isReact.filter(
        (id: any) => id.toString() !== userId
      );
    }
    await message.save();

    const pusherReaction: ResponseReactMessageDTO = {
      id: message._id,
      boxId: message.boxId,
      isReact: message.isReact
    };
    await pusherServer
      .trigger(`private-${message.boxId}`, "react-message", pusherReaction)
      .then(() =>
        console.log("Message reaction successfully: ", pusherReaction)
      )
      .catch((error) => console.error("Failed to react message:", error));
    return pusherReaction;
  } catch (error) {
    console.error("Error react message: ", error);
    throw error;
  }
}

export async function findBoxChat(userId: string, receiverId: string) {
  try {
    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const boxChat = await MessageBox.findOne({
      $expr: { $lte: [{ $size: "$receiverIds" }, 2] },
      $or: [
        { receiverIds: { $all: [userObjectId, receiverObjectId] } },
        { receiverIds: { $in: [userObjectId, receiverObjectId] } }
      ]
    });

    if (boxChat) {
      return { success: true, boxId: boxChat._id.toString() };
    } else {
      return { success: false, boxId: "" };
    }
  } catch (error) {
    console.error("Error sending message: ", error);
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
