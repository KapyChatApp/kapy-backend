import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface ILocation extends Document, IAudit{
    gps: string
}

const LocationSchema = new Schema<ILocation>({
    gps:{type:String, required:true},
})

LocationSchema.add(AuditSchema);

const Location = models.Location || model('Location', LocationSchema);

export default Location;