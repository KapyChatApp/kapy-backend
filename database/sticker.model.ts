import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";

export interface ISticker extends Document, IAudit {
  name:string;
  file:Schema.Types.ObjectId;
}

const StickerSchema = new Schema<ISticker>({
  name:{type:String, required:true},
  file:{type:Schema.Types.ObjectId, required:true}
});

StickerSchema.add(AuditSchema);

const Sticker = models.Sticker || model("Sticker", StickerSchema);

export default Sticker;
