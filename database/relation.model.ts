import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IRelation extends Document, IAudit{
    stUser:Schema.Types.ObjectId;
    ndUser:Schema.Types.ObjectId;
    relation:string;
}

const RelationSchema = new Schema<IRelation>({
    stUser:{type:Schema.Types.ObjectId, required:true, ref:'User'},
    ndUser:{type:Schema.Types.ObjectId, required:true, ref:'User'},
    relation:{type:String, required:true}
});

RelationSchema.add(AuditSchema);

const Relation = models.Relation || model('Relation', RelationSchema);

export default Relation;