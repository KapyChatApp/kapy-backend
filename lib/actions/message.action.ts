/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message from "@/database/message.model";
import Report from "@/database/report.model";
import { connectToDatabase } from "../mongoose";
import {
  FileContent,
  MessageBoxDTO,
  MessageBoxGroupDTO,
  RequestSendMessageDTO,
  ResponseAMessageBoxDTO,
  ResponseMessageDTO,
  ResponseMessageManageDTO,
  PusherDelete,
  PusherRevoke,
  TextingEvent,
  ResponseReactMessageDTO,
  ReadedStatusPusher
} from "@/dtos/MessageDTO";
import mongoose, { Types } from "mongoose";
import User from "@/database/user.model";
import MessageBox from "@/database/message-box.model";
import formidable from "formidable";
import File from "@/database/file.model";
import { pusherServer } from "../pusher";
import Relation from "@/database/relation.model";
import { createFile } from "./file.action";
import { sendPushNotification } from "./notification.action";

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

    // eslint-disable-next-line prefer-const
    let detailBox = await MessageBox.findById(data.boxId);
    if (!detailBox) {
      throw new Error("Group MessageBox cannot update");
    }
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
            $set: { senderId: userId },
            $addToSet: { flag: userId } // Thêm userId vào mảng flag nếu chưa có
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
        return {
          success: true,
          message: "Send successfully",
          sendMessage: pusherMessage
        };
      }
      //Message private
      else if (receiverIdsArray.length === 2) {
        const otherId = receiverIdsArray.filter(
          (item: any) => item._id !== userId
        );
        const [stUserId, ndUserId] = [otherId[0], userId].sort();
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
            $addToSet: {
              receiverIds: userId, // Thêm userId vào mảng receiverIds nếu chưa có
              flag: userId // Thêm userId vào mảng flag nếu chưa có
            }
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
        return {
          success: true,
          message: "Send successfully",
          sendMessage: pusherMessage
        };
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
  const allReceiverIds = [leaderId, ...membersIds];
  // Kiểm tra xem message box đã tồn tại và flag có chứa leaderId
  const existMessageBox = await MessageBox.findOne({
    receiverIds: { $size: allReceiverIds.length, $all: allReceiverIds },
    groupName: { $eq: "" }
  });

  if (existMessageBox) {
    // Nếu tồn tại box và flag không chứa leaderId, thêm leaderId vào flag
    if (!existMessageBox.flag.includes(leaderId)) {
      // Cập nhật mảng flag để thêm leaderId
      existMessageBox.flag.push(leaderId);
      await existMessageBox.save();
      return {
        success: true,
        message: "Leader added to the existing box",
        messageBox: existMessageBox
      };
    }
    return {
      success: false,
      message: "Box already exists.",
      messageBox: existMessageBox
    };
  }

  const userObjectId = new Types.ObjectId(leaderId);
  const messageBox: MessageBoxDTO = await MessageBox.create({
    senderId: leaderId,
    receiverIds: [leaderId, ...membersIds],
    messageIds: [],
    groupName: groupName,
    groupAva: groupAva,
    flag: [leaderId, ...membersIds],
    pin: false,
    createBy: userObjectId
  });
  const pusherCreateGroup = messageBox;

  for (const memId of allReceiverIds) {
    await pusherServer
      .trigger(`private-${memId}`, "new-box", pusherCreateGroup)
      .then(() => console.log("Create group successfully: ", pusherCreateGroup))
      .catch((error) => console.error("Failed to create group:", error));
  }
  // return { success: true, messageBoxId: messageBox._id, messageBox };
  return {
    success: true,
    message: "Create box chat successfully",
    messageBox: messageBox
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

    if (action === "revoke") {
      if (message.createBy.toString() !== userId) {
        throw new Error("Unauthorized to delete or recall this message");
      }
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

    // Lấy mảng readedId từ lastMessage
    const readedId = lastMessage.readedId;
    let readedIdUpdated: string[] = readedId;

    // Nếu user chưa đọc message cuối cùng, thêm userId vào readedId
    if (!readedId.includes(userId)) {
      await Promise.all(
        messageBox.messageIds.map(async (messageId: any) => {
          const message = await Message.findById(messageId);
          if (message && !message.readedId.includes(userId)) {
            message.readedId.push(userId);
            readedIdUpdated = message.readedId;
            await message.save();
          }
        })
      );
    }

    // Gửi trạng thái lên Pusher (bao gồm cả trường hợp user đã đọc)
    const pusherMarkRead: ReadedStatusPusher = {
      success: true,
      readedId: readedIdUpdated, // Mảng readedId được cập nhật hoặc giữ nguyên
      boxId: boxId
    };

    await pusherServer
      .trigger(`private-${boxId}`, "readed-status", pusherMarkRead)
      .then(() => console.log("Message status sent to Pusher", pusherMarkRead))
      .catch((error) => console.error("Failed to create event: ", error));

    return pusherMarkRead;
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
            },
            { groupName: { $eq: "" } }
          ]
        },
        { _id: userId } // Hoặc ID của box là userId
      ],
      flag: { $in: [userId] } // Thêm điều kiện flag chứa userId
    }).populate("receiverIds", "firstName lastName nickName avatar");

    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }

    // Xử lý từng box để trả về nội dung cần thiết
    const messageBoxesWithContent = await Promise.all(
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
        let readStatus = false;
        let readedId = [];
        let lastMessageTime = new Date(0);

        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            readStatus = lastMessage.readedId.includes(userId);
            readedId = lastMessage.readedId;
            lastMessageTime = new Date(lastMessage.createAt);
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
          stranger: relationStranger ? true : false,
          readStatus,
          readedId,
          createBy: messageBox.createBy,
          lastMessageTime
        };
      })
    );

    messageBoxesWithContent.sort((a, b) => {
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });

    // Loại bỏ trường `lastMessageTime` trước khi trả về
    const finalResult: MessageBoxDTO[] = messageBoxesWithContent.map(
      ({ lastMessageTime, ...rest }) => rest
    );
    return {
      success: true,
      box: finalResult
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
          readStatus: false,
          readedId: [] // Không có tin nhắn thì mặc định là chưa đọc
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
          readStatus: false,
          readedId: [] // Không có tin nhắn thì mặc định là chưa đọc
        }
      };
    }

    // Kiểm tra trạng thái đã đọc
    const readedId = lastMessage.readedId;
    const readStatus = lastMessage.readedId.includes(userId);

    return {
      box: {
        ...messageBox.toObject(),
        readStatus,
        readedId
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
        {
          $expr: { $gte: [{ $size: "$receiverIds" }, 2] }
        },
        { receiverIds: { $in: [userId] } }
      ],
      groupName: { $ne: "" },
      flag: { $in: [userId] } // Thêm điều kiện flag chứa userId
    })
      .populate("receiverIds", "firstName lastName nickName avatar")
      .populate("senderId", "firstName lastName nickName avatar");

    if (!messageBoxes.length) {
      return {
        success: false,
        box: "No message boxes found for this userId"
      };
    }

    // Xử lý nội dung từng nhóm
    const messageBoxesWithContent = await Promise.all(
      messageBoxes.map(async (messageBox) => {
        // Lấy tin nhắn cuối cùng
        const lastMessageId =
          messageBox.messageIds[messageBox.messageIds.length - 1];
        console.log(messageBox.messageIds);
        let readedId = [];
        let readStatus = false;
        let lastMessageTime = new Date(0);
        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            readedId = lastMessage.readedId;
            readStatus = lastMessage.readedId.includes(userId);
            lastMessageTime = new Date(lastMessage.createAt);
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
          readedId,
          createBy: messageBox.createBy,
          lastMessageTime
        };
      })
    );
    messageBoxesWithContent.sort((a, b) => {
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });

    // Loại bỏ trường `lastMessageTime` trước khi trả về
    const finalResult: MessageBoxGroupDTO[] = messageBoxesWithContent.map(
      ({ lastMessageTime, ...rest }) => rest
    );
    return { success: true, box: finalResult };
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

export async function deleteBox(userId: string, boxId: string) {
  try {
    // Kết nối database
    await connectToDatabase();

    // Tìm MessageBox theo boxId
    const messageBox = await MessageBox.findById(boxId);

    if (!messageBox) {
      throw new Error("Message box doesn't exist.");
    }

    // Lấy danh sách messageIds từ box
    const { messageIds, flag } = messageBox;

    // Cập nhật visibility của userId thành false cho tất cả các tin nhắn trong box
    await Promise.all(
      messageIds.map(async (messageId: any) => {
        const message = await Message.findById(messageId);
        if (message) {
          message.visibility.set(userId, false);
          await message.save();
        }
      })
    );

    // Xóa userId khỏi mảng flag của message box
    const updatedFlag = flag.filter((id: any) => id.toString() !== userId);
    messageBox.flag = updatedFlag;

    // Lưu thay đổi của MessageBox
    await messageBox.save();

    return {
      success: true,
      message: "Delete box chat successfully."
    };
  } catch (error) {
    console.error("Error delete chat: ", error);
    throw new Error("Error delete chat.");
  }
}

export async function findBoxChat(userId: string, receiverId: string) {
  try {
    await connectToDatabase();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const boxChat = await MessageBox.findOne({
      receiverIds: { $size: 2, $all: [userObjectId, receiverObjectId] },
      flag: { $in: [userId] }
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

//Mange Group
export async function disbandGroup(userId: string, boxId: string) {
  try {
    await connectToDatabase();
    // Tìm và xóa MessageBox bằng chuỗi boxId
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox) {
      throw new Error("MessageBox not found");
    }
    if (messageBox.createBy.toString() !== userId) {
      throw new Error("Only leader can disband group.");
    }

    // Tìm các tin nhắn liên quan và xóa chúng
    const messages = await Message.find({ boxId: boxId });
    if (messages.length > 0) {
      // Lấy tất cả contentId từ các tin nhắn
      const contentIds = messages.flatMap((message) => message.contentId);

      // Xóa các file liên quan nếu có
      if (contentIds.length > 0) {
        await File.deleteMany({ _id: { $in: contentIds } });
      }

      // Xóa các tin nhắn
      await Message.deleteMany({ boxId: boxId });
    }
    await messageBox.deleteOne();
    return { success: true, message: "Delete successfully!" };
  } catch (error) {
    console.error("Error disband group:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function removeMember(targetedId: string, boxId: string) {
  try {
    await connectToDatabase();

    // Tìm MessageBox theo boxId
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox) {
      throw new Error("MessageBox not found");
    }
    if (messageBox.createBy.toString() === targetedId) {
      throw new Error("Have to change leader of group.");
    }
    // Kiểm tra nếu targetedId có trong receiverIds
    const receiverIndex = messageBox.receiverIds.findIndex(
      (id: any) => id.toString() === targetedId
    );
    if (receiverIndex === -1) {
      throw new Error("Targeted member is not part of this group.");
    }

    // Xóa targetedId khỏi receiverIds
    messageBox.receiverIds.splice(receiverIndex, 1);

    // Xóa targetedId khỏi flag (nếu tồn tại)
    const flagIndex = messageBox.flag.findIndex(
      (id: any) => id.toString() === targetedId
    );
    if (flagIndex !== -1) {
      messageBox.flag.splice(flagIndex, 1);
    }

    // Lưu lại các thay đổi
    await messageBox.save();

    await pusherServer.trigger(`private-${messageBox._id}`, "kick", {
      targetId: targetedId,
      boxId: messageBox._id
    });

    return { success: true, message: "Member removed successfully!" };
  } catch (error) {
    console.error("Error removing member:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function changeLeader(
  userId: string,
  newLeader: string,
  boxId: string
) {
  try {
    await connectToDatabase();

    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox) {
      throw new Error("MessageBox not found");
    }

    if (messageBox.createBy.toString() !== userId) {
      throw new Error("Only the current leader can change the group leader.");
    }

    const isReceiver = messageBox.receiverIds.some(
      (id: any) => id.toString() === newLeader
    );
    if (!isReceiver) {
      throw new Error("The new leader must be a member of the group.");
    }

    // Gán id của newLeader vào senderId (createBy)
    messageBox.createBy = new mongoose.Types.ObjectId(newLeader);

    // Lưu thay đổi
    await messageBox.save();

    return { success: true, message: "Leader changed successfully!" };
  } catch (error) {
    console.error("Error changing leader:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function addMember(
  userId: string,
  newMember: string[],
  boxId: string
) {
  try {
    await connectToDatabase();

    // Tìm MessageBox theo boxId
    const messageBox = await MessageBox.findById(boxId);
    if (!messageBox) {
      throw new Error("MessageBox not found");
    }
    if (messageBox.createBy.toString() !== userId) {
      throw new Error("Only leader can add new members");
    }
    const users = await User.find({ _id: { $in: newMember } });
    if (users.length !== newMember.length) {
      throw new Error("One or more members are not valid users");
    }

    newMember.forEach((memberId) => {
      if (!messageBox.receiverIds.includes(memberId)) {
        messageBox.receiverIds.push(memberId);
      }
      if (!messageBox.flag.includes(memberId)) {
        messageBox.flag.push(memberId);
      }
    });

    await messageBox.save();

    for (const memberId of newMember) {
      await Message.updateMany(
        { boxId: messageBox._id },
        { $set: { [`visibility.${memberId}`]: true } }
      );
    }

    const pusherCreateGroup = messageBox;

    for (const memId of messageBox.receiverIds) {
      await pusherServer
        .trigger(`private-${memId}`, "new-box", pusherCreateGroup)
        .then(() => console.log("Add member successfully: ", pusherCreateGroup))
        .catch((error) => console.error("Failed to add member:", error));
    }

    return { success: true, message: "Members added successfully!" };
  } catch (error) {
    console.error("Error adding members:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

//MANAGEMENT
export async function getAllMessage() {
  try {
    await connectToDatabase();
    const allMessages = await Message.find().populate("contentId createBy");

    const allReports = await Report.find({ targetType: "Message" });
    // Map dữ liệu Message và kiểm tra xem Message có bị báo cáo hay không
    const responseMessage: ResponseMessageManageDTO[] = allMessages.map(
      (item) => {
        const isReported = allReports.some(
          (report) => report.targetId.toString() === item._id.toString()
        );

        return {
          _id: item._id.toString(),
          flag: item.flag,
          readedId: item.readedId,
          contentId: item.contentId,
          text: item.text,
          boxId: item.boxId,
          createAt: item.createAt,
          createBy: {
            _id: item.createBy._id,
            firstName: item.createBy.firstName,
            lastName: item.createBy.lastName,
            nickName: item.createBy.nickName,
            avatar: item.createBy.avatar
          },
          isReact: item.isReact,
          isReported: isReported
        };
      }
    );

    console.log(responseMessage);
    return responseMessage;
  } catch (error) {
    console.error("Error fetching all messages: ", error);
    throw error;
  }
}

export async function getDetailMessage(id: string) {
  try {
    await connectToDatabase();

    const message = await Message.findById(id).populate("contentId createBy");

    if (!message) {
      throw new Error("Message not found");
    }

    const allReports = await Report.find({
      targetType: "Message",
      targetId: id
    });
    const isReported = allReports.length > 0;

    const responseMessage: ResponseMessageManageDTO = {
      _id: message._id,
      flag: message.flag,
      readedId: message.readedId,
      contentId: message.contentId,
      text: message.text,
      boxId: message.boxId,
      createAt: message.createAt,
      createBy: {
        _id: message.createBy._id,
        firstName: message.createBy.firstName,
        lastName: message.createBy.lastName,
        nickName: message.createBy.nickName,
        avatar: message.createBy.avatar
      },
      isReact: message.isReact,
      isReported: isReported
    };

    return responseMessage;
  } catch (error) {
    console.error("Error fetching message detail: ", error);
    throw error;
  }
}

export async function removeMessage(messageId: string) {
  try {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new Error("Invalid message ID");
    }
    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    return { message: "Message was successfully deleted" };
  } catch (error) {
    console.error("Error removing message from database: ", error);
    throw error;
  }
}

export async function hiddenMessage(messageId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    message.flag = false;

    await message.save();

    return { success: true, message: "Message was hidden" };
  } catch (error) {
    console.error("Error remove messages from database: ", error);
    throw error;
  }
}

export async function displayMessage(messageId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    message.flag = true;

    await message.save();

    return { success: true, message: "Message was displayed" };
  } catch (error) {
    console.error("Error displayed messages: ", error);
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

export async function updateMessage(messageId: string, newContent: string) {
  try {
    await connectToDatabase();

    const message = await Message.findOne({ _id: messageId });

    if (!message) {
      throw new Error("Message not found");
    }
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
  } catch (error) {
    console.error("Error editing message: ", error);
    throw error;
  }
}
