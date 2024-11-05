import { Schema } from "mongoose";
import { FileResponseDTO } from "./FileDTO";

export interface CreatePostDTO {
  userId: Schema.Types.ObjectId|undefined;
  caption: string;
  contentIds: Schema.Types.ObjectId[];
}

export interface PostResponseDTO{
  _id:Schema.Types.ObjectId;
  firstName:string;
  lastName:string;
  nickName:string;
  avatar:string;
  userId:Schema.Types.ObjectId;
  likedIds:Schema.Types.ObjectId[];
  shares:PostResponseDTO[];
  comments:Comment[];
  caption:string;
  createAt:string;
  contents:FileResponseDTO[];

}