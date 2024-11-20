import { Schema } from "mongoose";
import { UserResponseDTO } from "./UserDTO";

export interface FileContent {
  fileName: string;
  url: string;
  publicId: string;
  bytes: string;
  width: string;
  height: string;
  format: string;
  type: string;
}

export interface GPSContent {
  type: "gps";
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ
  description?: string; // Mô tả địa điểm (tuỳ chọn)
}

export interface RequestSendMessageDTO {
  boxId: string;
  content: string | GPSContent | FileContent;
  time: Date;
}

export interface ResponseMessageBoxDTO {
  messageBoxId: string;
  messageBox: {
    senderId: string;
    receiverIds: string[];
    messageIds: string[];
    groupName: string;
    groupAva: string;
    flag: boolean;
    pin: boolean;
    createAt: Date;
    createBy: Schema.Types.ObjectId;
  };
}

export interface Content {
  _id: string;
  content: string | FileContent | GPSContent;
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface MessageDTO {
  _id: string;
  flag: boolean;
  readedId: string[];
  contentId: Content[];
  text: string[];
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface ResponseMessageDTO {
  _id: string;
  flag: boolean;
  readedId: string[];
  contentId: Content[];
  text: string[];
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface ResponseSendingDTO {
  populatedMessage: MessageDTO;
  messageBox: ResponseMessageBoxDTO;
}

export interface LastMessageDTO {
  _id: string;
  flag: boolean;
  readedId: UserResponseDTO[];
  contentId: Content[];
  text: string[];
  createAt: string;
  createBy: string;
  __v: number;
}

export interface RespBoxChatArrangeDTO {
  pin: boolean;
  _id: string;
  senderId: UserResponseDTO;
  receiverIds: UserResponseDTO[];
  messageIds: MessageDTO[];
  flag: boolean;
  createAt: string;
  createBy: string;
  __v: number;
  lastMessage: LastMessageDTO;
}

export interface RespBoxGroupArrangeDTO {
  _id: string;
  senderId: UserResponseDTO;
  receiverIds: UserResponseDTO[];
  messageIds: MessageDTO[];
  flag: boolean;
  createAt: string;
  createBy: string;
  __v: number;
  groupAva: string;
  groupName: string;
  pin: boolean;
  lastMessage?: LastMessageDTO;
}

export interface SegmentMessageDTO {
  groupId?: string;
  userId: string;
  userName: string;
  ava: string;
  content: string | GPSContent | FileContent;
  time: Date;
  recipientId: string[];
}

export interface MessageBoxResponseDTO {
  _id: string;
  name: string;
  avatar: string;
  receiverId: string;
  messages: SegmentMessageDTO[];
}
