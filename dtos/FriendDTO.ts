import { Schema } from "mongoose";

export interface FriendRequestDTO{
    sender:string,
    receiver:string,
}

export interface FriendProfileRequestDTO{
    userId:Schema.Types.ObjectId | undefined,
    friendId:string| undefined
}