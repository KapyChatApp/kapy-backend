import { Schema, model, models, Document, Types } from "mongoose";

export interface IChat extends Document {
  members: Types.ObjectId[];
  messages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }]
  },
  { timestamps: true }
);

const Chat = models.Chat || model<IChat>("Chat", ChatSchema);

export default Chat;
