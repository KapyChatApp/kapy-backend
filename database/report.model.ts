import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";
import mongoose from "mongoose";
import "./post.model";
import "./user.model";
import "./comment.model";
import "./message.model";

export interface IReport extends Document, IAudit {
  content: string;
  flag: boolean;
  status: string;
  targetId: Schema.Types.ObjectId;
  targetType: string;
}

const ReportSchema = new Schema<IReport>({
  content: { type: String, required: true },
  flag: { type: Boolean, required: true, default: true },
  status: { type: String, required: true, default: "pending" },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetType: {
    type: String,
    required: true,
    enum: ["User", "Post", "Comment", "Message"],
  },
});

ReportSchema.methods.populateTarget = async function () {
  const targetModel = mongoose.model(this.targetType);
  this.target = await targetModel.findById(this.targetId).exec();
};

ReportSchema.add(AuditSchema);

const Report = models.Report || model("Report", ReportSchema);

export default Report;
