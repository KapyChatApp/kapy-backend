import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IComment extends Document, IAudit{
    userId:Schema.Types.ObjectId;
    replyId:Schema.Types.ObjectId;
    caption:string;
    contentId:Schema.Types.ObjectId;
    repliedIds:Schema.Types.ObjectId[];
    likedIds:Schema.Types.ObjectId[];
    flag:boolean;
}

const CommentSchema = new Schema<IComment>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    replyId:{type:Schema.Types.ObjectId, required:true},
    caption:{type:String},
    contentId:{type:Schema.Types.ObjectId},
    repliedIds:{type:[Schema.Types.ObjectId]},
    likedIds:{type:[Schema.Types.ObjectId]},
    flag: { type: Boolean, required: true, default: true },
  });
  
CommentSchema.add(AuditSchema);

const Comment = models.Comment || model('Comment', CommentSchema);

export default Comment;