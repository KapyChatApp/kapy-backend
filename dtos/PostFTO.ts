import { Schema } from "mongoose";

export interface CreatePostDTO {
  userId: Schema.Types.ObjectId|undefined;
  caption: string;
  contentIds: Schema.Types.ObjectId[];
}
