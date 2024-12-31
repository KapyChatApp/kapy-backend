import { Schema } from "mongoose";
import { FileResponseDTO } from "./FileDTO";
import { CommentResponseDTO } from "./CommentDTO";
import formidable from "formidable";

export interface CreatePostDTO {
  userId: Schema.Types.ObjectId | undefined;
  caption: string;
  contentIds: Schema.Types.ObjectId[];
}

export interface EditPostDTO {
  caption: string;
  remainContentIds: string[];
  contents: formidable.File[];
}

export interface PostResponseDTO {
  _id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  nickName: string;
  avatar: string;
  userId: Schema.Types.ObjectId;
  likedIds: Schema.Types.ObjectId[];
  shares: PostResponseDTO[];
  comments: CommentResponseDTO[];
  caption: string;
  createAt: string;
  contents: FileResponseDTO[];
}

export interface PostResponseManageDTO {
  _id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  nickName: string;
  avatar: string;
  userId: Schema.Types.ObjectId;
  likedIds: Schema.Types.ObjectId[];
  shares: PostResponseDTO[];
  comments: CommentResponseDTO[];
  caption: string;
  createAt: string;
  contents: FileResponseDTO[];
  flag: boolean;
}
