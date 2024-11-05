import { Schema, models, model, Document } from "mongoose";
import { IAudit, AuditSchema } from "./audit.model";
export interface IUser extends Document, IAudit {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  email: string;
  password: string;
  roles: string[];
  avatar: string;
  avatarPublicId:string;
  background: string;
  backgroundPublicId:string;
  gender: boolean;
  address: string;
  job: string;
  hobbies: string;
  bio: string;
  point: number;
  relationShip: string;
  birthDay: Date;
  attendDate: Date;
  flag: boolean;
  friendIds: Schema.Types.ObjectId[];
  bestFriendIds: Schema.Types.ObjectId[];
  blockedIds: Schema.Types.ObjectId[];
  postIds:Schema.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  nickName: { type: String, required: false },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], required: true },
  avatar: { type: String, required: false },
  avatarPublicId:{type:String, require:false},
  background: { type: String, required: false },
  backgroundPublicId:{type:String, required:false},
  gender: { type: Boolean, required: false },
  address: { type: String, required: false },
  job: { type: String, required: false },
  hobbies: { type: String, required: false },
  bio: { type: String, required: false },
  point: { type: Number, required: false, default: 0 },
  relationShip: { type: String, required: false },
  birthDay: { type: Date, required: false },
  attendDate: { type: Date, required: true },
  flag: { type: Boolean, required: true, default: true },
  friendIds: [{ type: [Schema.Types.ObjectId], ref: "User" }],
  bestFriendIds: [{ type: [Schema.Types.ObjectId], ref: "User" }],
  blockedIds: [{ type: [Schema.Types.ObjectId], ref: "User" }],
  postIds: {type:[Schema.Types.ObjectId], ref:"Post"},
});

UserSchema.add(AuditSchema);

const User = models.User || model("User", UserSchema);

export default User;
