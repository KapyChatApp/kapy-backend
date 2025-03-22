import Post from "@/database/post.model";
import { connectToDatabase } from "../mongoose";
import { PostResponseDTO } from "@/dtos/PostDTO";
import User from "@/database/user.model";
import { CommentResponseDTO } from "@/dtos/CommentDTO";
import { FileResponseDTO } from "@/dtos/FileDTO";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";
import { getAComment } from "./comment.action";
import Comment from "@/database/comment.model";
import File from "@/database/file.model";
import { getMyBFFs } from "./mine.action";
import { Schema } from "mongoose";

export const getAllBFFSocialPost = async (
    userId:Schema.Types.ObjectId|undefined,
  page: number,
  limit: number
) => {
  connectToDatabase();
  const skip = (page - 1) * limit;

  const myBFFs = await getMyBFFs(userId);

  const bffIds = myBFFs.map((myBFF)=>myBFF._id);

  if(userId){
    bffIds.push(userId);
  }
  
  const filter = { userId: { $in: bffIds } };

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    console.log("post found: ", posts);

  const postResponses: PostResponseDTO[] = [];

  for (const post of posts) {
    const user = await User.findById(post.userId);
    const fileOfPost = await File.find({_id:{$in:post.contentIds}});
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

    const commentResponses: CommentResponseDTO[] = [];

    const comments = await Comment.find({ _id: { $in: post.comments } });
    for (const comment of comments) {
      const commentResponse: CommentResponseDTO = await getAComment(
        comment._id
      );
      commentResponses.push(commentResponse);
    }

    const tags: ShortUserResponseDTO[] = [];
    const tagUsers = await User.find({ _id: { $in: post.tagIds } });
    for (const user of tagUsers) {
      const tag: ShortUserResponseDTO = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
      };
      tags.push(tag);
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
      tags: tags,
      musicName: post.musicName,
      musicURL: post.musicURL,
      musicAuthor: post.musicAuthor,
      musicImageURL: post.musicImageURL,
    };
    postResponses.push(postResponse);
  }

  return postResponses;
};
