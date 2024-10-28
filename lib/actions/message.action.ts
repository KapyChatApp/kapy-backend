/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"user server";

import Message from "@/database/message.model";
import { connectToDatabase } from "../mongoose";
import { SegmentMessageDTO } from "@/dtos/MessageDTO";
import mongoose, { Types } from "mongoose";
import User from "@/database/user.model";
import Text from "@/database/text.model";
import Image from "@/database/image.model";
import Location from "@/database/gps.model";
import Icon from "@/database/icon.model";
import Video from "@/database/video.model";
import Voice from "@/database/voice.schema";
import Post from "@/database/post.model";
import MessageBox from "@/database/message-box.model";

async function createContent(data: SegmentMessageDTO) {
  let contentModel: string;
  let contentId: mongoose.Types.ObjectId;
  const userObjectId = new Types.ObjectId(data.userId);

  if (typeof data.content === "string") {
    contentModel = "Text";
    const textContent = await Text.create({
      content: data.content,
      createBy: userObjectId
    });
    contentId = textContent._id;
  } else if (data.content.type === "image") {
    contentModel = "Image";
    const imageContent = await Image.create({
      fileName: data.content.altText,
      path: data.content.url,
      size: 0,
      createBy: userObjectId
    });
    contentId = imageContent._id;
  } else if (data.content.type === "link") {
    contentModel = "Text";
    const textContent = await Text.create({
      content: data.content.url,
      createBy: userObjectId
    });
    contentId = textContent._id;
  } else if (data.content.type === "file") {
    contentModel = "Text";
    const textContent = await Text.create({
      content: data.content.fileName + "-" + data.content.fileUrl,
      createBy: userObjectId
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
      createBy: userObjectId
    });
    contentId = locationContent._id;
  } else if (data.content.type === "icon") {
    contentModel = "Icon";
    const iconContent = await Icon.create({
      content: data.content.name,
      createBy: userObjectId
    });
    contentId = iconContent._id;
  } else if (data.content.type === "video") {
    contentModel = "Video";
    const videoContent = await Video.create({
      fileName: data.content.fileName,
      path: data.content.fileUrl,
      size: data.content.duration,
      createBy: userObjectId
    });
    contentId = videoContent._id;
  } else if (data.content.type === "voice") {
    contentModel = "Voice";
    const voiceContent = await Voice.create({
      fileName: data.content.fileName,
      path: data.content.fileUrl,
      size: data.content.duration,
      createBy: userObjectId
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
      createBy: userObjectId
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
    createBy: userObjectId
  });

  return message;
}

export async function createMessage(data: SegmentMessageDTO) {
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
      const membersIds = groupMessageBox.receiverIds.push(
        groupMessageBox.senderId
      );
      const allRecipientsExist = data.recipientId.every((recipient) =>
        membersIds.includes(recipient)
      );
      const leaderExists = membersIds.includes(data.userId);

      if (!allRecipientsExist || !leaderExists) {
        throw new Error(
          "All recipientIds and userId must be in MembersId list"
        );
      }

      const message = await createContent(data);
      const populatedMessage = await Message.findById(message._id).populate({
        path: "contentId",
        model: message.contentModel,
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
        const message = await createContent(data);
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: message.contentModel,
          select: "",
          options: { strictPopulate: false }
        });
        let messageBox = await MessageBox.findOneAndUpdate(
          {
            senderId: data.userId,
            $addToSet: { receiverIds: { $each: data.recipientId } }
          },
          { $push: { messageIds: message._id } },
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
            messageIds: [message._id],
            flag: true,
            createBy: userObjectId
          });
        }

        return { success: true, populatedMessage, messageBox };
      }
    }
  } catch (error) {
    console.error("Error sending message: ", error);
    throw error;
  }
}

export async function createGroup(membersIds: string[], leaderId: string) {
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
    flag: true,
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
  contentId: string,
  newContent: SegmentMessageDTO["content"],
  userId: string
) {
  try {
    await connectToDatabase();

    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.readedId.includes(userId)) {
      const contentIndex = message.contentId.findIndex(
        (id: { toString: () => string }) => id.toString() === contentId
      );
      if (contentIndex === -1) {
        throw new Error("Content not found");
      }
      if (message.contentModel === "Text") {
        const userObjectId = new Types.ObjectId(userId);
        const newText = await Text.create({
          content: newContent,
          createBy: userObjectId
        });
        message.contentId.push(newText._id);
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
      const recoverContent = "Message is revoked";
      const message = await Message.findById(messageId);
      const contentIdToRevoke =
        message.contentId[message.contentId.length - 1].toString();
      console.log(contentIdToRevoke);
      await editMessage(messageId, contentIdToRevoke, recoverContent, userId);
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

    let filteredMessages = messages;

    filteredMessages = messages.filter((message) => {
      return message.contentModel === "Text";
    });

    const populatedMessages = await Promise.all(
      filteredMessages.map(async (message) => {
        const populatedMessage = await Message.findById(message._id).populate({
          path: "contentId",
          model: message.contentModel,
          select: ""
        });
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
  } catch (error) {
    console.error("Error searching messages: ", error);
    throw error;
  }
}

//MANAGEMENT
export async function getAllMessage() {
  try {
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
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const { contentModel, contentId: contentIds } = message;

    let ContentModel;
    switch (contentModel) {
      case "Text":
        ContentModel = Text;
        break;
      case "Image":
        ContentModel = Image;
        break;
      case "Video":
        ContentModel = Video;
        break;
      case "Voice":
        ContentModel = Voice;
        break;
      case "Location":
        ContentModel = Location;
        break;
      default:
        throw new Error("Invalid content model");
    }

    await ContentModel.deleteMany({ _id: { $in: contentIds } });

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
