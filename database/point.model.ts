import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface IPoint extends Document, IAudit {
  userId: string;
  point: number;
  message: string;
}

const PointSchema = new Schema<IPoint>({
  userId: { type: String, required: true },
  point: { type: Number, required: true, default: 100, min: 0, max: 2000 },
  message: { type: String, required: true, default: "", maxlength: 1000 },
});

PointSchema.add(AuditSchema);

const Point = models.Point || model("Point", PointSchema);

export default Point;
