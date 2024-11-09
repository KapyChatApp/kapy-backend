import { Schema } from "mongoose";
import { UserResponseDTO } from "./UserDTO";

export interface ImageContent {
  type: "image";
  url: string;
  altText?: string;
}
export interface LinkContent {
  type: "link";
  url: string;
  title?: string;
}
export interface FileContent {
  type: "file";
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface VideoContent {
  type: "video";
  fileName: string;
  fileUrl: string;
  fileType: string;
  duration: number;
}

export interface VoiceContent {
  type: "voice";
  fileName: string;
  fileUrl: string;
  fileType: string;
  duration: number;
}

export interface PostContent {
  type: "post";
  userId: string;
  likedIds?: string[];
  shares?: string[];
  comments?: string[];
  content: string;
}

export interface IconContent {
  type: "icon";
  name: string;
}

export interface GPSContent {
  type: "gps";
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ
  description?: string; // Mô tả địa điểm (tuỳ chọn)
}

export interface SegmentMessageDTO {
  groupId?: string;
  userId: string;
  userName: string;
  ava: string;
  content:
    | string
    | ImageContent
    | LinkContent
    | FileContent
    | VideoContent
    | GPSContent
    | IconContent
    | PostContent
    | VoiceContent;
  time: Date;
  recipientId: string[];
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
  content:
    | string
    | ImageContent
    | LinkContent
    | FileContent
    | VideoContent
    | GPSContent
    | IconContent
    | PostContent
    | VoiceContent;
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface MessageDTO {
  _id: string;
  flag: boolean;
  readedId: string[];
  contentModel: string;
  contentId: Content[];
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface ResponseMessageDTO {
  _id: string;
  flag: boolean;
  readedId: string[];
  contentModel: string;
  contentId: Content[];
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
  contentModel: string;
  contentId: Content[];
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
