"user server";

import Message from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import { SegmentGroupDTO, SegmentMessageDTO } from "@/dtos/MessageDTO";
import mongoose, { Schema } from "mongoose";
import Chat from "@/database/chat.model";
import User from "@/database/user.model";
import Text from "@/database/text.model";
import Image from "@/database/image.model";
import Location from "@/database/gps.model";
import Icon from "@/database/icon.model";
import Video from "@/database/video.model";
import Voice from "@/database/voice.schema";
import Post from "@/database/post.model";

type SendMessageData = SegmentMessageDTO | SegmentGroupDTO;

export async function createMessage(
  data: SendMessageData,
  createBy: Schema.Types.ObjectId | undefined
) {
  try {
    await connectToDatabase();

    if (!data.userId) {
      throw new Error("User ID is required");
    }

    let contentModel: string;
    let contentId: mongoose.Types.ObjectId;

    if (typeof data.content === "string") {
      contentModel = "Text";
      const textContent = await Text.create({
        content: data.content,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = textContent._id;
    } else if (data.content.type === "image") {
      contentModel = "Image";
      const imageContent = await Image.create({
        fileName: data.content.url.split("/").pop(),
        path: data.content.url,
        size: 0,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = imageContent._id;
    } else if (data.content.type === "link") {
      contentModel = "Text";
      const textContent = await Text.create({
        content: data.content.url,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = textContent._id;
    } else if (data.content.type === "file") {
      contentModel = "Text";
      const textContent = await Text.create({
        content: data.content.fileName,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = textContent._id;
    } else if (data.content.type === "gps") {
      contentModel = "Location";
      const gps =
        data.content.latitude.toString() +
        "-" +
        data.content.longitude.toString();
      const locationContent = await Location.create({
        gps: gps,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = locationContent._id;
    } else if (data.content.type === "icon") {
      contentModel = "Icon";
      const iconContent = await Icon.create({
        content: data.content.name,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = iconContent._id;
    } else if (data.content.type === "video") {
      contentModel = "Video";
      const videoContent = await Video.create({
        fileName: data.content.fileName,
        path: data.content.fileUrl,
        size: data.content.duration,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = videoContent._id;
    } else if (data.content.type === "voice") {
      contentModel = "Voice";
      const voiceContent = await Voice.create({
        fileName: data.content.fileName,
        path: data.content.fileUrl,
        size: data.content.duration,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = voiceContent._id;
    } else if (data.content.type === "post") {
      contentModel = "Post";
      const postContent = await Post.create({
        userId: data.userId, // Lưu ID người dùng
        likedIds: [],
        shares: [],
        comments: [],
        content: data.content.content, // Nội dung bài viết
        createdAt: new Date(),
        flag: true,
        createBy: createBy ? createBy : new mongoose.Types.ObjectId()
      });
      contentId = postContent._id;
    } else {
      throw new Error("Invalid content type");
    }

    const message = await Message.create({
      flag: true,
      readedId: [data.userId],
      contentModel: contentModel,
      contentId: [contentId],
      createdAt: new Date(),
      updatedAt: new Date(),
      createBy: createBy ? createBy : new mongoose.Types.ObjectId()
    });

    if ("groupId" in data) {
      const groupChat = await Chat.findByIdAndUpdate(
        data.groupId,
        { $push: { messages: message._id } },
        { new: true }
      );
      if (!groupChat) {
        throw new Error("Group is not found");
      }
      return { success: true, message, groupChat };
    } else {
      let chat = await Chat.findOneAndUpdate(
        { members: { $all: [data.userId, data.recipientId] } },
        { $push: { messages: message._id } },
        { new: true }
      );

      if (!chat) {
        const recipientExists = await User.exists({ _id: data.recipientId });
        if (!recipientExists) {
          throw new Error("Recipient does not exist");
        }
        chat = await Chat.create({
          members: [data.userId, data.recipientId],
          messages: [message._id]
        });
      }

      return { success: true, message, chat };
    }
  } catch (error) {
    console.error("Error sending message: ", error);
    throw error;
  }
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

export async function deleteOrRecallMessage(
  messageId: string,
  userId: string,
  action: "recall" | "delete"
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

    if (action === "recall") {
      await Message.findByIdAndDelete(messageId);
      return { success: true, messageId, message: "Message recalled" };
    } else if (action == "delete") {
      message.flag = false;
      await message.save();
      return { success: true, messageId };
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error deleting or recalling message: ", error);
    throw error;
  }
}

export async function editMessage(
  messageId: string,
  newContent: SegmentMessageDTO["content"],
  userId: string
) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message is not found");
    }

    if (message.readedId.includes(userId)) {
      message.content = newContent;
      message.updatedAt = new Date();
      await message.save();
      return { success: true, message };
    } else {
      throw new Error("Unauthorized to edit this message");
    }
  } catch (error) {
    console.error("Error editing message: ", error);
    throw error;
  }
}

export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    await connectToDatabase();
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (!message.readedId.includes(userId)) {
      message.readedId.push(userId);
    }

    return { success: true, message };
  } catch (error) {
    console.error("Error marking message as read: ", error);
    throw error;
  }
}

export async function fetchMessage(chatId?: string, groupId?: string) {
  try {
    await connectToDatabase();
    if (chatId) {
      const chat = await Chat.findById(chatId).populate("messages");
      if (!chat) {
        throw new Error("Chat not found");
      }
      return { success: true, messages: chat.messages };
    }
    if (groupId) {
      const groupChat = await Chat.findById(groupId).populate("messages");
      if (!groupChat) {
        throw new Error("Group chat not found");
      }
      return { success: true, messages: groupChat.messages };
    }
    throw new Error("Either chatId or groupId must be provided");
  } catch (error) {
    console.error("Error fetching messages: ", error);
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
    if (query) {
      conditions.content = { $regex: query, $options: "i" };
    }

    const messages = await Message.find(conditions);

    return { success: true, messages };
  } catch (error) {
    console.error("Error searching messages: ", error);
    throw error;
  }
}
