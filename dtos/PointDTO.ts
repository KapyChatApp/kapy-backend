import { ShortUserResponseDTO } from "./UserDTO";

export interface CreatePointDTO {
  userId: string;
  point: number;
  message: string;
}

export interface EditPointDTO{
    point:number;
    message:string;
}

export interface PointResponseDTO{
    _id:string;
    point:number;
    message:string;
    createAt:string;
    user:ShortUserResponseDTO
}