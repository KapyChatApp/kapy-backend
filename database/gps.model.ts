import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface ILocation extends Document, IAudit {
  latitude:string;                 // Vĩ độ
  longitude:       string;     // Kinh độ
  altitude:               string;   // Độ cao so với mực nước biển (nếu có)
  accuracy: string;                 // Độ chính xác của vĩ độ và kinh độ (mét)
  altitudeAccuracy: string;        // Độ chính xác của độ cao (mét, nếu có)
  heading: string;                 // Hướng di chuyển của thiết bị (độ)
  speed: string;
}

const LocationSchema = new Schema<ILocation>({
  latitude:{type:String, required:true},
  longitude:{type:String, required:true},
  altitude: {type:String,required:true},
  accuracy:{type:String, required:true},
  altitudeAccuracy:{type:String,required:true},
  heading:{type:String, required:true},
  speed:{type:String, required:true}
});

LocationSchema.add(AuditSchema);

const Location = models.Location || model("Location", LocationSchema);

export default Location;
