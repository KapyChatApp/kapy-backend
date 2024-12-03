import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IMessage extends Document, IAudit {
  flag: boolean;
  readedId: Schema.Types.ObjectId[];
  contentId: Schema.Types.ObjectId[];
  text: string[];
  boxId: Schema.Types.ObjectId;
  isReact: boolean;
  visibility: Map<string, boolean>;
}

const MessageSchema = new Schema<IMessage>({
  flag: { type: Boolean, required: true, default: true },
  isReact: { type: Boolean, required: true, default: false },
  readedId: [{ type: Schema.Types.ObjectId, ref: "User" }],
  contentId: [{ type: Schema.Types.ObjectId, ref: "File" }],
  boxId: { type: Schema.Types.ObjectId, ref: "MessageBox" },
  text: [{ type: String }],
  visibility: {
    type: Map,
    of: Boolean,
    default: () => new Map([["defaultUserId", true]])
  }
});

MessageSchema.add(AuditSchema);

const Message = models.Message || model("Message", MessageSchema);

export default Message;
