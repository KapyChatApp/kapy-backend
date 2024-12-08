import { FileResponseDTO } from "./FileDTO";

export interface StickerResponseDTO{
    _id:string;
    name:string;
    fileId:string;
    file:FileResponseDTO;
    createAt:string;
    createBy:string;
}