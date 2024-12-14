import { Schema } from "mongoose";
import { FileResponseDTO } from "./FileDTO";
import formidable from "formidable";

export interface CreateCommentDTO {
  filesToUpload: formidable.File|null;
  caption: string | undefined;
  userId: Schema.Types.ObjectId | undefined;
  replyId:string;
  targetType:string;
}

export interface EditCommentDTO{
 caption:string;
   keepOldContent:boolean;
   content:formidable.File | null;
}

export interface CommentResponseDTO {
  _id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  nickName: string;
  avatar: string;
  userId: Schema.Types.ObjectId;
  likedIds: Schema.Types.ObjectId[];
  replieds: CommentResponseDTO[];
  caption: string;
  createAt: string;
  createBy:string;
  content?: FileResponseDTO;
}
