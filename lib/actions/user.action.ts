/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import {
  FindUserDTO,
  OnlineEvent,
  ShortUserResponseDTO,
  UpdatePasswordDTO,
  UpdateUserDTO,
  UserRegisterDTO,
  UserResponseDTO,
} from "@/dtos/UserDTO";
import { connectToDatabase } from "../mongoose";
import User from "@/database/user.model";
import bcrypt from "bcrypt";
import mongoose, { Schema, Types } from "mongoose";
import Relation from "@/database/relation.model";
import jwt from "jsonwebtoken";
import { pusherServer } from "../pusher";
import { getMutualFriends } from "./friend.action";
import Realtime from "@/database/realtime.model";
import { getRelationFromTo } from "./relation.action";
const saltRounds = 10;
const SECRET_KEY = process.env.JWT_SECRET!;

export async function getAllUsers() {
  try {
    connectToDatabase();
    const result: UserResponseDTO[] = await User.find();

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function createUser(
  params: UserRegisterDTO,
  createBy: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();

    const existedUser = await User.findOne({
      $or: [
        { email: params.email, flag: true },
        { phoneNumber: params.phoneNumber, flag: true },
      ],
    });

    if (params.password !== params.rePassword) {
      throw new Error("Your re-password is wrong!");
    }

    if (existedUser) {
      throw new Error("User is already exist!");
    }

    const hashPassword = await bcrypt.hash(params.password, saltRounds);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rePassword, password, ...userData } = params;

    const createUserData = Object.assign({}, userData, {
      password: hashPassword,
      attendDate: new Date(),
      roles: ["user"],
      createBy: createBy ? createBy : new mongoose.Types.ObjectId(),
    });

    const newUser: UserResponseDTO = await User.create(createUserData);

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

export async function createAdmin(
  params: UserRegisterDTO,
  createBy: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();

    const existedUser = await User.findOne({
      $or: [{ email: params.email }, { phoneNumber: params.phoneNumber }],
    });

    if (params.password !== params.rePassword) {
      throw new Error("Your re-password is wrong!");
    }

    if (existedUser) {
      throw new Error("User is already exist!");
    }

    const hashPassword = await bcrypt.hash(params.password, saltRounds);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rePassword, password, ...userData } = params;

    const createUserData = Object.assign({}, userData, {
      password: hashPassword,
      attendDate: new Date(),
      roles: ["admin", "user"],
      createBy: createBy ? createBy : "unknown",
    });

    const newUser: UserResponseDTO = await User.create(createUserData);

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

export async function findPairUser(id1: string, id2: string) {
  try {
    connectToDatabase();
    const stUser = await User.findById(id1);
    const ndUser = await User.findById(id2);
    if (!stUser || !ndUser) {
      throw new Error("Your require user is not exist!");
    }
    return { stUser, ndUser };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function findUser(
  phoneNumber: string | undefined,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();

    const user = await User.findOne({
      phoneNumber: phoneNumber,
    });
    if (!user) {
      throw new Error("Not found");
    }
    const mutualFriends = await getMutualFriends(userId?.toString(), user._id);
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const relation = await getRelationFromTo(userId?.toString()!,user._id.toString());
    const result: FindUserDTO = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      avatar: user.avatar,
      relation: relation,
      mutualFriends: mutualFriends!,
    };
    
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function findUserById(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Not found");
    }
    const result = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      roles: user.roles,
      avatar: user.avatar,
      avatarPublicId: user.avatarPublicId,
      background: user.background,
      backgroundPublicId: user.backgroundPublicId,
      gender: user.gender,
      address: user.address,
      job: user.job,
      hobbies: user.hobbies,
      bio: user.bio,
      point: user.point,
      relationShip: user.relationShip,
      birthDay: user.birthDay,
      attendDate: user.attendDate,
      flag: user.flag,
      friendIds: user.friendIds,
      bestFriendIds: user.bestFriendIds,
      blockedIds: user.blockedIds,
      posts: user.posts,
    };
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updateUser(
  userId: Schema.Types.ObjectId | undefined,
  params: UpdateUserDTO
) {
  try {
    connectToDatabase();

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      throw new Error("User not found!");
    }

    const updatedUser: UserResponseDTO | null = await User.findByIdAndUpdate(
      userId,
      params,
      {
        new: true,
      }
    );

    return { status: true, newProfile: updatedUser };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updatePassword(
  userId: Schema.Types.ObjectId | undefined,
  params: UpdatePasswordDTO
) {
  try {
    connectToDatabase();

    // Cập nhật mật khẩu
    const updatedUser: UserResponseDTO | null = await User.findByIdAndUpdate(
      userId,
      {
        password: params.password,
        rePassword: params.rePassword,
      },
      { new: true } // Để trả về document đã cập nhật
    );

    if (!updatedUser) {
      throw new Error("User not found.");
    }

    return {
      success: true,
      message: "Password updated successfully.",
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function disableUser(userId: string) {
  try {
    connectToDatabase();
    const existedUser = await User.findById(userId);

    if (!existedUser) {
      throw new Error(`User ${userId} is not exist`);
    }

    const disableUser = await User.findByIdAndUpdate(userId, { flag: false });

    return disableUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyProfile(id: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const myProfile: UserResponseDTO | null = await User.findById(id);
    if (!myProfile) {
      console.log(`Cannot get ${id} profile now`);
      throw new Error(`Cannot get ${id} profile now`);
    }
    return myProfile;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function onlineEvent(userId: string) {
  try {
    const pusherOnline: OnlineEvent = {
      userId: userId,
      online: true,
      updateTime:new Date()
    };

    const realtime = await Realtime.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (realtime) {
      realtime.isOnline = true;
      realtime.updateTime = new Date();
      await realtime.save();
    } else {
      await Realtime.create({
        userId: new Types.ObjectId(userId),
        isOnline: true,
        createBy: new Types.ObjectId(userId),
        updateTime: () => new Date(),
      });
    }

    await pusherServer
      .trigger(`private-${userId}`, "online-status", pusherOnline)
      .then(() => console.log("User is online", pusherOnline))
      .catch((error) => console.error("Failed to create event: ", error));
    return pusherOnline;
  } catch (error) {
    console.error("Error to create event: ", error);
    throw error;
  }
}

export async function offlineEvent(userId: string) {
  try {
    const pusherOnline: OnlineEvent = {
      userId: userId,
      online: false,
      updateTime:new Date()
    };

    const realtime = await Realtime.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (realtime) {
      realtime.isOnline = false;
      realtime.updateTime = new Date();
      await realtime.save();
    } else {
      await Realtime.create({
        userId: new Types.ObjectId(userId),
        isOnline: false,
        createBy: new Types.ObjectId(userId),
        updateTime: () => new Date(),
      });
    }

    await pusherServer
      .trigger(`private-${userId}`, "offline-status", pusherOnline)
      .then(() => console.log("User is offline", pusherOnline))
      .catch((error) => console.error("Failed to create event: ", error));
    return pusherOnline;
  } catch (error) {
    console.error("Error to create event: ", error);
    throw error;
  }
}
