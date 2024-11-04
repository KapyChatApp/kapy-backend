import cloudinary from "@/cloudinary";
import User from "@/database/user.model";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";

export async function uploadAvatar(
  userId: Schema.Types.ObjectId | undefined,
  url: string,
  publicId: string
) {
  try {
    connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not exist");
    }

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
      console.log("Previous avatar removed from Cloudinary");
    }

    user.avatar = url;
    user.avatarPublicId = publicId;
    await user.save();

    return { message: "Upload avatar successfully" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function uploadBackground(
  userId: Schema.Types.ObjectId | undefined,
  url: string,
  publicId: string
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not exist");
    }

    if (user.backgroundPublicId) {
      await cloudinary.uploader.destroy(user.backgroundPublicId);
      console.log("Previous background removed from Cloudinary");
    }

    user.background = url;
    user.backgroundPublicId = publicId;

    await user.save();

    return { message: "Upload avatar successfully" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
