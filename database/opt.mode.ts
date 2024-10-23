import { Schema, models, model, Document } from "mongoose";

export interface IOTP extends Document {
  code: string;
  sender: string;
  receiver: string;
  createAt: Date;
  expiredAt: Date;
}

const OTPSchema = new Schema({
  code: { type: String, required: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  createAt: { type: Date, required: true, default: new Date() },
  expiredAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 1000),
  },
});

OTPSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const OTP = models.OTP || model("OTP", OTPSchema);

export default OTP;
