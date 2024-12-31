import { Schema } from "mongoose";
import { IPost } from "@/database/post.model";
import { IComment } from "@/database/comment.model";
import { IUser } from "@/database/user.model";
import { ShortUserResponseDTO } from "./UserDTO";

export interface ReportResponseDTO {
  _id: string;
  content: string;
  flag: boolean;
  status: string;
  userId: Schema.Types.ObjectId;
  target: IPost | IComment | IUser;
}
export interface ReportResponseManageDTO {
  _id: string;
  content: string;
  flag: boolean;
  status: string;
  createAt: string;
  userId: ShortUserResponseDTO;
  targetType: string;
  target: IPost | IComment | IUser;
}

export interface CreateReportDTO {
  content: string;
  targetId: Schema.Types.ObjectId;
  targetType: string;
}

export interface UpdateReportDTO {
  content: string;
}

export interface VerifyReportDTO {
  status: string;
}
