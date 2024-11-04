import { CreatePostDTO } from "@/dtos/PostFTO";
import { connectToDatabase } from "../mongoose";
import mongoose from "mongoose";
import Post from "@/database/post.model";

export const createPost = async (param:CreatePostDTO)=>{
    try{
        connectToDatabase();
        const postData = Object.assign(param, {createBy:param.userId? param.userId:new mongoose.Types.ObjectId(), flag:true});
        const createdPost = await Post.create(postData);
        return createdPost;
    }catch(error){
        console.log(error);
        throw error;
    }
}