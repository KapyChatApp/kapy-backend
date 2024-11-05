import { CreatePostDTO } from "@/dtos/PostFTO";
import { connectToDatabase } from "../mongoose";
import mongoose, { Schema } from "mongoose";
import Post from "@/database/post.model";
import formidable from "formidable";
import { createFile } from "./file.action";
import User from "@/database/user.model";

export const createPost = async (param: CreatePostDTO) => {
  try {
    connectToDatabase();
    const postData = Object.assign(param, {
      createBy: param.userId ? param.userId : new mongoose.Types.ObjectId(),
      flag: true,
    });
    const createdPost = await Post.create(postData);
    return createdPost;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const addPost = async (
  filesToUpload: formidable.File[],
  caption: string[] | undefined,
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    const contendIds: Schema.Types.ObjectId[] = [];

    for (const file of filesToUpload) {
        const createdFile = await createFile(file,userId);
      contendIds.push(createdFile._id);
    }

    if (contendIds.length == 0) {
      throw new Error("Creating file failed!");
    }

    const postData: CreatePostDTO = {
      userId: userId,
      caption: caption ? caption.toString() : "",
      contentIds: contendIds,
    };
    const postDataToCreate = await Object.assign(postData, {createBy:userId});
    const createdPost = await Post.create(postDataToCreate);

    const user = await User.findById(userId);
    console.log(createdPost);
    await user.postIds.addToSet(createdPost._id);

    await user.save();

    return createPost;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
