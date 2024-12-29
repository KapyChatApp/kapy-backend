import MapStatus from "@/database/map-status.model";
import { LocationDTO } from "@/dtos/LocationDTO";
import { Schema } from "mongoose";
import { locationLiveUpdate } from "./location.action";
import User from "@/database/user.model";
import {
  CreateMapStatusDTO,
  EditMapStatusDTO,
  MapStatusResponseDTO,
} from "@/dtos/MapStatusDTO";
import { createFile, deleteFile } from "./file.action";
import { pusherServer } from "../pusher";

export const initiateMyMapStatus = async (
  userId: Schema.Types.ObjectId | undefined,
  location: LocationDTO
) => {
  try {
    const existMapStatus = await MapStatus.findOne({ createBy: userId });
    if (existMapStatus) {
      await locationLiveUpdate(userId, location);
      return await MapStatus.findById(existMapStatus._id)
        .populate("content")
        .populate("location");
    } else {
      const createdLocation = await locationLiveUpdate(userId, location);
      const createdMapStatus = await MapStatus.create({
        location: createdLocation._id,
        createBy: userId,
      });
      return await MapStatus.findById(createdMapStatus._id)
        .populate("content")
        .populate("location");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getMyBestFriendMapStatus = async (
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    const user = await User.findById(userId);
    const bffMapStatuses = await MapStatus.find({
      createBy: { $in: user.bestFriendIds },
    })
      .populate("content")
      .populate("location")
      .populate("createBy");
    const bffMapStatusResponses: MapStatusResponseDTO[] = [];
    for (const map of bffMapStatuses) {
      const bffMapStatusResponse: MapStatusResponseDTO = {
        _id: map._id,
        caption: map.caption,
        content: map.content,
        location: map.location,
        createAt: map.createAt.toString(),
        createBy: {
          _id: map.createBy._id,
          firstName: map.createBy.firstName,
          lastName: map.createBy.lastName,
          nickName: map.createBy.nickName,
          avatar: map.createBy.avatar,
        },
      };
      bffMapStatusResponses.push(bffMapStatusResponse);
    }
    return bffMapStatusResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMyStatus = async (
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    const status = await MapStatus.findOne({ createBy: userId })
      .populate("content")
      .populate("location")
      .populate("createBy");
    if (!status) {
      return;
    }
    const statusResponse: MapStatusResponseDTO = {
      _id: status._id,
      caption: status.caption,
      content: status.content,
      location: status.location,
      createAt: status.createAt,
      createBy: {
        _id: status.createBy._id,
        firstName: status.createBy.firstName,
        lastName: status.createBy.lastName,
        nickName: status.createBy.nickName,
        avatar: status.createBy.avatar,
      },
    };
    return statusResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAStatus = async (id: string) => {
  try {
    const status = await MapStatus.findById(id)
      .populate("content")
      .populate("location")
      .populate("createBy");
    const statusResponse: MapStatusResponseDTO = {
      _id: status._id,
      caption: status.caption,
      content: status.content,
      location: status.location,
      createAt: status.createAt,
      createBy: {
        _id: status.createBy._id,
        firstName: status.createBy.firstName,
        lastName: status.createBy.lastName,
        nickName: status.createBy.nickName,
        avatar: status.createBy.avatar,
      },
    };
    return statusResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createStatus = async (
  userId: Schema.Types.ObjectId | undefined,
  param: CreateMapStatusDTO
) => {
  try {
    const status = await MapStatus.findOne({ createBy: userId });
    console.log(status);
    if (param.file) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const content = await createFile(param.file, userId?.toString()!);
      status.content = content._id;
    }
    status.caption = param.caption;
    await status.save();
    const createdMapStatus = await getAStatus(status._id);
    await pusherServer.trigger(
      `private-${userId}`,
      "map-status",
      createdMapStatus
    );
    return createdMapStatus;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const editStatus = async (
  userId: Schema.Types.ObjectId | undefined,
  id: string,
  param: EditMapStatusDTO
) => {
  try {
    const status = await MapStatus.findById(id);
    if (userId?.toString() != status.createBy.toString()) {
      throw new Error("You cannot edit this Status");
    }
    console.log("isKeepOldContent:  ", param.keepOldContent);
    if (param.keepOldContent) {
      status.caption = param.caption;
    } else {
      status.caption = param.caption;
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      if (status.content) {
        await deleteFile(status.content.toString(), userId);
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      }
      if (param.file) {
        const newContent = await createFile(param.file!, userId?.toString()!);
        status.content = newContent._id;
      }
    }
    await status.save();
    const updatedStatus = await getAStatus(status._id);
    await pusherServer.trigger(
      `private-${userId}`,
      "map-status",
      updatedStatus
    );
    return updatedStatus;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteStatus = async (
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    const existStatus = await MapStatus.findOne({ createBy: userId });

    if (!existStatus) {
      throw new Error("Status not exist");
    }
    existStatus.caption = "";
    if (existStatus.content) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      await deleteFile(existStatus.content.toString(), userId);
    }
    existStatus.content = null;
    await existStatus.save();
    await pusherServer.trigger(`private-${userId}`, "map-status", null);
    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
