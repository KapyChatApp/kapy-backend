import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IMessageBox extends Document, IAudit {
  senderId: Schema.Types.ObjectId;
  receiverIds: Schema.Types.ObjectId[];
  messageIds: Schema.Types.ObjectId[];
  flag: boolean;
}

const MessageBoxSchema = new Schema<IMessageBox>({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  messageIds: [{ type: Schema.Types.ObjectId, ref: "Message", required: true }],
  flag: { type: Boolean, required: true, default: true },
});

MessageBoxSchema.add(AuditSchema);

const MessageBox = models.MessageBox || model("MessageBox", MessageBoxSchema);

export default MessageBox;
