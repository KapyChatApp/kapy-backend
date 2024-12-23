import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IMapStatus extends Document, IAudit{
    caption:string;
    content:Schema.Types.ObjectId;
    location:Schema.Types.ObjectId;
} 

const MapStatusSchema = new Schema<IMapStatus>({
    caption:{type:String, required:true},
    content:{type:Schema.Types.ObjectId},
    location:{type:Schema.Types.ObjectId, required:true}
});

MapStatusSchema.add(AuditSchema);

const MapStatus =  models.MapStatus || model("MapStatus", MapStatusSchema);

export default MapStatus;
 