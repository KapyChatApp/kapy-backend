import { Schema } from "mongoose";

export interface FriendRequestDTO{
    sender:string,
    receiver:string,
}

export interface FriendResponseDTO{
    _id:Schema.Types.ObjectId,
    avatar:string,
    firstName:string,
    lastName:string,
    nickName:string
}

export interface RequestedResponseDTO{
    _id:Schema.Types.ObjectId,
    firstName:string,
    lastName:string;
    avatar:string;
    relation:string;
    createAt:string;
}