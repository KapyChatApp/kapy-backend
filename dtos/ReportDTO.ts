import { Schema } from "mongoose";
import { IPost } from "@/database/post.model";
import { IComment } from "@/database/comment.model";
import { IUser } from "@/database/user.model";

export interface ReportResponseDTO {
    _id:string;
  content: string;
  flag: boolean;
  status: string;
  userId: Schema.Types.ObjectId;
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

export interface VerifyReportDTO{
    status:string,
}