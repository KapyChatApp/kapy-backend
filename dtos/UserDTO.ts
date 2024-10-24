import { Schema } from "mongoose";
export interface UserRegisterDTO {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  email: string;
  password: string;
  rePassword:string;
  gender: boolean;
  address: string;
  birthDay: Date;
}

export interface UserLoginDTO {
  phoneNumber: string;
  password: string;
}
export interface AuthenticationDTO{
  message:string;
  token:string;
}

export interface UserResponseDTO {
  firstName: string;
  lastName: string;
  nickName: string;
  phoneNumber: string;
  email: string;
  role: string[];
  avatar: string;
  background: string;
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
  createAt: Date;
  createBy: Schema.Types.ObjectId;
}

export interface UpdateUserDTO{
  firstName: string;
  lastName: string;
  nickName: string;
  gender: boolean;
  address: string;
  job: string;
  hobbies: string;
  bio: string;
  point: number;
  relationShip: string;
  birthDay: Date;
}