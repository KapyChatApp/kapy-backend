import { Schema, Document, model, models } from 'mongoose';

export interface IAudit extends Document {
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export const AuditSchema = new Schema<IAudit>({
  createAt: { type: Date, required: true, default: () => new Date() }, 
  createBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
},{timestamps:false});


const Audit = models.Audit || model('Audit', AuditSchema);

export default Audit;