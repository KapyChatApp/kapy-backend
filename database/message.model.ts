import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IMessage extends Document, IAudit {
  flag: boolean;
  readedId: Schema.Types.ObjectId[];
  contentModel: string;
  contentId: Schema.Types.ObjectId[];
}

const MessageSchema = new Schema<IMessage>({
  flag: { type: Boolean, required: true, default: true },
  readedId: [{ type: Schema.Types.ObjectId, ref: "User" }],
  contentModel: {
    type: String,
    required: true,
    enum: ["Text", "Image", "Video", "Voice", "Location"],
  },
  contentId: [
    {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "contentModel",
    },
  ],
});

MessageSchema.add(AuditSchema);

const Message = models.Message || model("Message", MessageSchema);

export default Message;
