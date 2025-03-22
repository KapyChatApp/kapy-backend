import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IPost extends Document, IAudit {
  userId: Schema.Types.ObjectId;
  likedIds: Schema.Types.ObjectId[];
  shares: Schema.Types.ObjectId[];
  comments: Schema.Types.ObjectId[];
  caption: string;
  contentIds: Schema.Types.ObjectId[];
  tagIds: Schema.Types.ObjectId[];
  musicName:string;
  musicURL:string;
  musicAuthor:string;
  musicImageURL:string;
  flag: boolean;
}

const PostSchema = new Schema<IPost>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  likedIds: { type: [Schema.Types.ObjectId], ref: "User" },
  shares: { type: [Schema.Types.ObjectId], ref: "User" },
  comments: { type: [Schema.Types.ObjectId], ref: "Comment" },
  caption: { type: String, required: false },
  contentIds: {
    type: [Schema.Types.ObjectId],
    required: false,
  },
  tagIds: {type:[Schema.Types.ObjectId], ref:"User"},
  musicName:{type:String},
  musicURL:{type:String},
  musicAuthor:{type:String},
  musicImageURL:{type:String},
  flag: { type: Boolean, required: true, default: true },
});

PostSchema.add(AuditSchema);

const Post = models.Post || model("Post", PostSchema);

export default Post;
