import OTP from "@/database/opt.mode";
import { connectToDatabase } from "../mongoose";
import jwt from "jsonwebtoken";
import {
  AuthResponsDTO,
  CountAuthHistoryReponseDTO,
  CreateAuthDTO,
} from "@/dtos/AuthDTO";
import mongoose, { Schema } from "mongoose";
import User from "@/database/user.model";
import AuthHistory from "@/database/auth-history.model";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}

export async function sendSMS(phoneNumber: string) {
  try {
    const otp = generateOTP();
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `App ${process.env.INFOBIP_APIKEY}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");

    const raw = JSON.stringify({
      messages: [
        {
          destinations: [{ to: phoneNumber }],
          from: process.env.SENDER_PHONENUMBER,
          text: `Your verification code is ${otp}`,
        },
      ],
    });

    fetch("https://api.infobip.com/sms/2/text/advanced", {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    })
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

    connectToDatabase();
    const createdOTP = await OTP.create({
      code: otp,
      sender: process.env.SENDER_PHONENUMBER,
      receiver: phoneNumber,
    });

    return createdOTP;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function checkToken(rareToken: string) {
  try {
    const token = rareToken && rareToken.split(" ")[1];
    const decodedToken = jwt.decode(token) as { exp: number } | null;
    if (!decodedToken || !decodedToken.exp) {
      throw new Error("Token is invalid");
    }

    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedToken.exp > currentTime) {
      return { isAuthenticated: true };
    }
    return { isAuthenticated: false };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createDeviceInfo(
  userId: Schema.Types.ObjectId | undefined,
  param: CreateAuthDTO
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not exist");
    }
    const createdAuthHistory = await AuthHistory.create({
      ...param,
      createBy: userId,
      isActive: true,
    });
    const authResponse: AuthResponsDTO = {
      _id: createdAuthHistory._id,
      logTime: createdAuthHistory.createAt,
      deviceName: createdAuthHistory.deviceName,
      isSafe: createdAuthHistory.isSafe,
      region: createdAuthHistory.region,
      isActive: createdAuthHistory.isActive,
      deviceType: createdAuthHistory.deviceType,
      brand: createdAuthHistory.brand,
      modelName: createdAuthHistory.modelName,
      osName: createdAuthHistory.osName,
      osVersion: createdAuthHistory.osVersion,
      user: {
        _id: createdAuthHistory.createBy._id,
        firstName: createdAuthHistory.createBy.firstName,
        lastName: createdAuthHistory.createBy.lastName,
        nickName: createdAuthHistory.createBy.nickName,
        avatar: createdAuthHistory.createBy.avatar,
      },
    };
    return authResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function inActiveDeviceInfo(
  userId: Schema.Types.ObjectId | undefined,
  id: string
) {
  try {
    const authHistory = await AuthHistory.findOne({_id:id});
    if (authHistory.createBy.toString() !== userId?.toString()) {
      throw new Error("You are not authorize");
    }
    authHistory.isActive = false;
    await authHistory.save();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MjFkN2VjMzYxMmMzYzg4ZmY1YmIyMCIsInVzZXJuYW1lIjoiNTU1NTU1NTU1NSIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNzM1NDcyOTU5LCJleHAiOjE3MzU4MzI5NTl9.G7rc-REJKWGTLIRtFlFOE5ksYZBLwJ-GFQzqdyzdNrw
//6771373fe7307dcaa23095aa
export async function getMyAuthHistory(
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    return await AuthHistory.find({ createBy: userId });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyAuthHistoryOfUser(userId: string) {
  try {
    return await AuthHistory.find({
      createBy: new mongoose.Types.ObjectId(userId),
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function countAuthHistory() {
  try {
    const totalMobile = await AuthHistory.countDocuments({
      deviceType: "PHONE",
      isActive: true,
    });
    const totalBrowser = await AuthHistory.countDocuments({
      deviceType: "DESKTOP",
    });
    const result: CountAuthHistoryReponseDTO = {
      totalMobile: totalMobile,
      totalBrowser: totalBrowser,
    };
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
