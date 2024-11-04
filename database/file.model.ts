import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IFile extends Document, IAudit {
  fileName: string;
  url: string;
  publicId: string;
  bytes: string;
  width: string;
  height: string;
  format: string;
  type: string;
}

const FileSchema = new Schema<IFile>({
  fileName: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  bytes: { type: String, required: true },
  width: { type: String, required: true },
  height: { type: String, required: true },
  format: { type: String, required: true },
  type: { type: String, required: true },
});

FileSchema.add(AuditSchema);

const File = models.File || model("File", FileSchema);

export default File;
