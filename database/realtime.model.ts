import { Schema, Document, models, model } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IRealtime extends Document, IAudit {
  userId: Schema.Types.ObjectId;
  isOnline: boolean;
  updateTime:Date;
}

const RealtimeSchema = new Schema<IRealtime>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  isOnline: { type: Boolean, required: true, default: true },
  updateTime:{type:Date, required:true}
});

RealtimeSchema.add(AuditSchema);

const Realtime = models.Realtime || model("Realtime", RealtimeSchema);

export default Realtime;
