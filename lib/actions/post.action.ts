import { CreatePostDTO, PostResponseDTO } from "@/dtos/PostFTO";
import { connectToDatabase } from "../mongoose";
import mongoose, { Schema } from "mongoose";
import Post from "@/database/post.model";
import formidable from "formidable";
import { createFile } from "./file.action";
import User from "@/database/user.model";
import File from "@/database/file.model";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { findPairUser } from "./user.action";
import Relation from "@/database/relation.model";
import { CommentResponseDTO } from "@/dtos/CommentDTO";
import Comment from "@/database/comment.model";
import { getAComment } from "./comment.action";

export const getAPost = async (
  postId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    const [stUserId, ndUserId] = [
      post.userId.toString(),
      userId.toString(),
    ].sort();
    if (userId.toString() != post.userId.toString()) {
      const relation = await Relation.findOne({
        stUser: stUserId,
        ndUser: ndUserId,
        relation: "bff",
        status: true,
      });
      if (!relation) {
        return false;
      }
    }
    const user = await User.findById(post.userId);
    const fileOfPost = await File.find({
      _id: { $in: post.contentIds },
    }).exec();
    const filesResponse: FileResponseDTO[] = [];
    for (const file of fileOfPost) {
      const fileResponse: FileResponseDTO = {
        _id: file._id,
        url: file.url,
        fileName: file.fileName,
        width: file.width,
        height: file.height,
        format: file.format,
        bytes: file.bytes,
        type: file.type,
      };
      filesResponse.push(fileResponse);
    }

    const commentResponses:CommentResponseDTO[] = []; 
      
    const comments = await Comment.find({_id:{$in:post.comments}});
    for(const comment of comments){
      const commentResponse:CommentResponseDTO = await getAComment(comment._id);
      commentResponses.push(commentResponse);
    }

    const postResponse: PostResponseDTO = {
      _id: post._id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      avatar: user.avatar,
      userId: post.userId,
      likedIds: post.likedIds,
      comments: commentResponses,
      shares: post.shares,
      caption: post.caption,
      createAt: post.createAt,
      contents: filesResponse,
    };

    for (const c of postResponse.comments){
      console.log("replys: "+ c.replieds);
    }
    return postResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getSingleIdPosts = async (userId: string) => {
  try {
    connectToDatabase();
    if (!userId) {
      throw new Error("You ara unauthenticated!");
    }
    const user = await User.findById(userId);
    const posts = await Post.find({ userId: userId });
    if (posts.length == 0) {
      return false;
    }
    const postsResponse: PostResponseDTO[] = [];
    for (const post of posts) {
      const fileOfPost = await File.find({
        _id: { $in: post.contentIds },
      }).exec();
      const filesResponse: FileResponseDTO[] = [];
      for (const file of fileOfPost) {
        const fileResponse: FileResponseDTO = {
          _id: file._id,
          url: file.url,
          fileName: file.fileName,
          width: file.width,
          height: file.height,
          format: file.format,
          bytes: file.bytes,
          type: file.type,
        };
        filesResponse.push(fileResponse);
      }
      
      const commentResponses:CommentResponseDTO[] = []; 
      
      const comments = await Comment.find({_id:{$in:post.comments}});
      for(const comment of comments){
        const commentResponse:CommentResponseDTO = await getAComment(comment._id);
        commentResponses.push(commentResponse);
      }

      const postResponse: PostResponseDTO = {
        _id: post._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
        userId: post.userId,
        likedIds: post.likedIds,
        comments: commentResponses,
        shares: post.shares,
        caption: post.caption,
        createAt: post.createAt,
        contents: filesResponse,
      };
      postsResponse.push(postResponse);
    }
    return postsResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getFriendPosts = async (
  friendId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    await findPairUser(friendId, userId.toString());
    const [stUserId, ndUserId] = [friendId, userId.toString()].sort();
    const relation = await Relation.findOne({
      stUser: stUserId,
      ndUser: ndUserId,
      relation: "bff",
      status: true,
    });
    if (!relation) {
      return false;
    }

    const posts = await getSingleIdPosts(friendId);

    return posts;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

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
    if (filesToUpload.length != 0) {
      for (const file of filesToUpload) {
        const createdFile = await createFile(file, userId);
        contendIds.push(createdFile._id);
      }

      if (contendIds.length == 0) {
        throw new Error("Creating file failed!");
      }
    }
    const postData: CreatePostDTO = {
      userId: userId,
      caption: caption ? caption.toString() : "",
      contentIds: contendIds,
    };
    const postDataToCreate = await Object.assign(postData, {
      createBy: userId,
    });
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


export const deletePost = async (
  postId: string,
  userId: Schema.Types.ObjectId
) => {
  try {
    connectToDatabase();
    const post = await Post.findById(postId);
    if (post.userId != userId.toString()) {
      console.log("You are unauthenticated!");
    }

    await Post.findByIdAndDelete(postId);

    return { message: `Delete post ${postId} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
