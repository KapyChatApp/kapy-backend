import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IAuthHistory extends Document, IAudit{
    logTime:Date;
    deviceName:string;
    region:string;
    isSafe:boolean;
    userId:Schema.Types.ObjectId;
}

const AuthHistorySchema = new Schema<IAuthHistory>({
    logTime: { type: Date, required: true, default: Date.now },
    deviceName: { type: String, required: true },
    region: { type: String, required: true },
    isSafe: { type: Boolean, required: true, default: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  });

AuthHistorySchema.add(AuditSchema);


const AuthHistory = models.AuthHistory || model('AuthHistory',AuthHistorySchema);

export default AuthHistory;
