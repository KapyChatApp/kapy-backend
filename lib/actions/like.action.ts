import Post from "@/database/post.model";
import User from "@/database/user.model";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";

export const like = async (
  postId: string | undefined,
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    connectToDatabase()
    const post = await Post.findById(postId);
    const user = await User.findById(userId);
    if (!post || !user) {
      throw new Error("Your require content is not exist!");
    }
    await post.likedIds.addToSet(userId);

    await post.save();

    return { message: `Liked post ${postId}` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const disLike = async (
  postId: string | undefined,
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    const user = await User.findById(userId);
    if (!post || !user) {
      throw new Error("Your required content does not exist!");
    }

    await post.likedIds.pull(userId);

    await post.save();

    return { message: `Disliked post ${postId}` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getDetailLikeOfPost = async(postId:string)=>{
  try{
    const post = await Post.findById(postId);
    const likedUsers = await User.find({_id:{$in:post.likedIds}});
    const likedUserResponses: ShortUserResponseDTO[]=[];
    for(const user of likedUsers){
      const likedUserResponse: ShortUserResponseDTO ={
        _id:user._id,
        firstName:user.firstName,
        lastName:user.lastName,
        nickName:user.nickName,
        avatar:user.avatar,
      }
      likedUserResponses.push(likedUserResponse);
    }
    return likedUserResponses;
  }catch(error){
    console.log(error);
    throw error;
  }
}