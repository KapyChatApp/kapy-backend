import Sticker from "@/database/sticker.model";
import { StickerResponseDTO } from "@/dtos/StickerDTO";
import formidable from "formidable";
import { createFile } from "./file.action";
import { Schema } from "mongoose";
export const getASticker = async (id:string)=>{
    try{
        const sticker = await Sticker.findById(id).populate("file", "_id fileNam url bytes width height  format type"); 
        const stickerResponse:StickerResponseDTO = {
            _id:sticker._id,
            name:sticker.name,
            fileId:sticker.file._id,
            file:sticker.file,
            createAt:sticker.createAt,
            createBy:sticker.createBy,
        }
        return stickerResponse;
    }catch(error){
        console.log(error);
        throw error;

    }
}
export const allStickers = async()=>{
    try{
        const stickers = await Sticker.find().populate("file", "_id fileNam url bytes width height  format type");
        const stickerResponses:StickerResponseDTO[] = [];
        for(const sticker of stickers){
            const stickerResponse:StickerResponseDTO = {
                _id:sticker._id,
                name:sticker.name,
                fileId:sticker.file._id,
                file:sticker.file,
                createAt:sticker.createAt,
                createBy:sticker.createBy,
            }
            stickerResponses.push(stickerResponse);
        }
        return stickerResponses;
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const  findSticker = async (q:string)=>{
    try{
       const stickers = await Sticker.find({name:{$regex:q}}).populate("file", "_id fileNam url bytes width height  format type");
       const stickerResponses:StickerResponseDTO[] = [];
       for(const sticker of stickers){
           const stickerResponse:StickerResponseDTO = {
               _id:sticker._id,
               name:sticker.name,
               fileId:sticker.file._id,
               file:sticker.file,
               createAt:sticker.createAt,
               createBy:sticker.createBy,
           }
           stickerResponses.push(stickerResponse);
       }
       return stickerResponses;
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const createSticker = async (file:formidable.File, name:string, userId:Schema.Types.ObjectId)=>{
    try{
        const stickerFile = await createFile(file, userId);
        const sticker = await Sticker.create({name:name, file:stickerFile._id,createBy:userId});
        return sticker;
    }catch(error){
        console.log(error);
        throw error;
    }
}

// export const updateSticker = async (name:string, id:string,userId:string,file:formidable.File | undefined)=>{
//     try{
//        const existSticker = await Sticker.findById(id).populate("file", "_id fileNam url bytes width height  format type");
       
//        if(!existSticker){
//         return {message:"This sticker is not exist!"}
//        }

//        if(!file){
//         await 
//         const stickerFile = await createFile(file, userId);
//        }
//     }catch(error){
//         console.log(error);
//         throw error;
//     }
// }