import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IReport extends Document, IAudit {
  content: string;
  flag: boolean;
  status: string;
  userId: Schema.Types.ObjectId;
  targetId: Schema.Types.ObjectId;
}

const ReportSchema = new Schema<IReport>({
  content: { type: String, required: true },
  flag: { type: Boolean, required: true, default: true },
  status: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

ReportSchema.add(AuditSchema);

const Report = models.Report || model("Report", ReportSchema);

export default Report;
