import { Schema, models, model, Document } from "mongoose";

export interface IAudit extends Document {
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export const AuditSchema = new Schema<IAudit>({
  createAt: { type: Date, required: true, default: Date.now() },
  createBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const Audit = models.Audit || model("Audit", AuditSchema);

export default Audit;
