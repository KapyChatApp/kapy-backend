import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IAuthHistory extends Document, IAudit{
    deviceName:string;
    deviceType:string;
    brand:string;
    modelName:string;
    osName:string;
    osVersion:string; 
    region:string;
    isSafe:boolean;
    isActive:boolean;
}

const AuthHistorySchema = new Schema<IAuthHistory>({
    deviceName: { type: String, required: true },
    deviceType:{type:String, required:true},
    brand:{type:String},
    modelName:{type:String},
    osName:{type:String},
    osVersion:{type:String},
    region: { type: String, required: true },
    isSafe: { type: Boolean, default: true },
    isActive:{type:Boolean, default:true}
  });

AuthHistorySchema.add(AuditSchema);


const AuthHistory = models.AuthHistory || model('AuthHistory',AuthHistorySchema);

export default AuthHistory;
