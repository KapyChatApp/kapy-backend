import formidable from "formidable";
import { FileResponseDTO } from "./FileDTO";
import { LocationDTO } from "./LocationDTO";
import { ShortUserResponseDTO } from "./UserDTO";

export interface MapStatusResponseDTO{
    _id:string;
    caption:string;
    content:FileResponseDTO;
    location:LocationDTO;
    createAt:string;
    createBy:ShortUserResponseDTO;
}

export interface CreateMapStatusDTO{
    caption:string;
    file?:formidable.File;
}

export interface EditMapStatusDTO{
    caption?:string;
    file?:formidable.File;
    keepOldContent?:boolean;
}