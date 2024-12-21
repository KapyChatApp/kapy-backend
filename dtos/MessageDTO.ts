export interface FileContent {
  _id: string;
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
  _id: string;
  type: "gps";
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ
  description?: string; // Mô tả địa điểm (tuỳ chọn)
}

export interface RequestSendMessageDTO {
  boxId: string;
  content: string | FileContent | undefined;
}

export interface UserInfoBox {
  _id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  avatar: string;
  phone: string;
}
export interface MessageBoxDTO {
  _id: string;
  senderId: string;
  receiverIds: UserInfoBox[];
  groupName: string;
  groupAva: string;
  flag: boolean;
  pin: boolean;
  readStatus: boolean;
  stranger: boolean;
}
export interface MessageBoxGroupDTO {
  _id: string;
  senderId: UserInfoBox[];
  receiverIds: UserInfoBox[];
  groupName: string;
  groupAva: string;
  flag: boolean;
  pin: boolean;
  readStatus: boolean;
}

export interface ResponseMessageDTO {
  id: string;
  flag: boolean;
  readedId: string[];
  contentId: FileContent | GPSContent;
  text: string;
  boxId: string;
  createAt: string;
  createBy: string;
  isReact: string[];
}

export interface ResponseReactMessageDTO {
  id: string;
  boxId: string;
  isReact: string[];
}

export interface ResponseMessageManageDTO {
  id: string;
  flag: boolean;
  readedId: string[];
  contentId: FileContent[] | GPSContent[];
  text: string[];
  boxId: string;
  createAt: string;
  createBy: string;
  isReact: string[];
}

export interface ResponseAMessageBoxDTO {
  _id: string;
  name: string;
  avatar: string;
  receiverId: string;
  messages: ResponseMessageDTO[];
}

export interface DetailMessageBoxDTO {
  _id: string;
  senderId: UserInfoBox;
  receiverIds: UserInfoBox[];
  messageIds: string[];
  groupName: string;
  groupAva: string[];
  flag: boolean;
  pin: boolean;
  createAt: string;
  createBy: string;
  readStatus: boolean;
}

export interface PusherRevoke {
  id: string;
  flag: boolean;
  isReact: string[];
  text: string;
  boxId: string;
  action: string;
  createAt: string;
  createBy: string;
}

export interface PusherDelete {
  id: string;
  flag: boolean;
  visibility: boolean;
  isReact: string[];
  text: string;
  boxId: string;
  action: string;
  createAt: string;
  createBy: string;
}

export interface TextingEvent {
  boxId: string;
  userId: string;
  avatar: string;
  texting: boolean;
}
