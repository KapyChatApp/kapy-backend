import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IStatus extends Document, IAudit {
  userId: Schema.Types.ObjectId;
  content: string;
}

const StatusSchema = new Schema<IStatus>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  content: { type: String, required: true },
});

StatusSchema.add(AuditSchema);

const Status = models.Status || model("Status", StatusSchema);

export default Status;
