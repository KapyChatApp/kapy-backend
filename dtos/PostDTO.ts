import { Schema } from "mongoose";
import { FileResponseDTO } from "./FileDTO";
import { CommentResponseDTO } from "./CommentDTO";
import formidable from "formidable";
import { ShortUserResponseDTO } from "./UserDTO";

export interface CreatePostDTO {
  userId: Schema.Types.ObjectId | undefined;
  caption: string;
  contentIds: Schema.Types.ObjectId[];
  tagIds: Schema.Types.ObjectId[];
  musicName: string;
  musicURL: string;
  musicAuthor: string;
  musicImageURL: string;
}

export interface EditPostDTO {
  caption: string;
  remainContentIds: string[];
  contents: formidable.File[];
  tagIds: string[];
  musicName: string;
  musicURL: string;
  musicAuthor: string;
  musicImageURL: string;
}

export interface PostResponseDTO {
  _id: string;
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
  tags: ShortUserResponseDTO[];
  musicName: string;
  musicURL: string;
  musicAuthor: string;
  musicImageURL: string;
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

export interface CheckedPostReponse {
  _id: string;
  firstName: string;
  lastName: string;
  userId: string;
  likedIds: number;
  shares: number;
  comments: number;
  caption: string;
  createAt: string;
  contents: FileResponseDTO[];
  flag: boolean;
}
