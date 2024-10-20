import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IComment extends Document, IAudit{
    userId:Schema.Types.ObjectId;
    replyId:Schema.Types.ObjectId;
    replyModel:Schema.Types.ObjectId;
    flag:boolean;
}

const CommentSchema = new Schema<IComment>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    // replyModel dùng để xác định loại tham chiếu (Post hoặc Comment)
    replyModel: { 
      type: String, 
      required: true, 
      enum: ['Post', 'Comment'] // Giá trị có thể là Post hoặc Comment
    },
  
    // replyId sẽ tham chiếu động dựa trên giá trị của replyModel
    replyId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'replyModel',  // Thiết lập refPath động
    },
  
    flag: { type: Boolean, required: true, default: true },
  });
  
CommentSchema.add(AuditSchema);

const Comment = models.Comment || model('Comment', CommentSchema);

export default Comment;