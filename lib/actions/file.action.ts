import cloudinary from "@/cloudinary";
import File from "@/database/file.model";
import formidable from "formidable";
import { Schema, Types } from "mongoose";
import { connectToDatabase } from "../mongoose";
import { FileResponseDTO } from "@/dtos/FileDTO";
import User from "@/database/user.model";

const generateRandomString = (length = 20) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
  
    return result;
  };

  export const getAFile = async (fileId:string)=>{
    try{
      connectToDatabase();
      const file =await File.findById(fileId);
      const fileResponse: FileResponseDTO = {
        _id: file._id,
        url: file.url,
        fileName: file.fileName,
        width: file.width,
        height: file.height,
        format: file.format,
        bytes: file.bytes,
        type: file.type,
      };

      return fileResponse;
    }catch(error){
      console.log(error);
      throw error;
    }
  }

export async function createFile(file: formidable.File, userId: string) {
    try {
      connectToDatabase();
      const mimetype = file.mimetype;
      let result = null;
      let type = "";
      if (mimetype?.startsWith("image/")) {
        // Upload hình ảnh
        result = await cloudinary.uploader.upload(file.filepath, {
          folder: "Avatar"
        });
        type = "Image";
      } else if (mimetype?.startsWith("video/")) {
        // Upload video
        result = await cloudinary.uploader.upload(file.filepath, {
          resource_type: "video",
          folder: "Videos"
        });
        type = "Video";
      } else if (mimetype?.startsWith("audio/")) {
        // Upload âm thanh
        result = await cloudinary.uploader.upload(file.filepath, {
          resource_type: "auto",
          public_id: `Audios/${file.originalFilename}`,
          folder: "Audios"
        });
        type = "Audio";
      } else {
        result = await cloudinary.uploader.upload(file.filepath, {
          resource_type: "raw",
          public_id: `Documents/${file.originalFilename}`,
          folder: "Documents"
        });
        type = "Other";
      }
  
      const createdFile = await File.create({
        fileName:
          type === "Other" ? file.originalFilename : generateRandomString(),
        url: result.url,
        publicId: result.public_id,
        bytes: result.bytes,
        width: result.width || "0",
        height: result.height || "0",
        format: result.type || "unknown",
        type: type,
        createBy: new Types.ObjectId(userId)
      });
      return createdFile;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  

export const deleteFile = async (id:string, userId:Schema.Types.ObjectId | undefined)=>{
  try{
    const existFile = await File.findById(id);
    const user = await User.findById(userId);
    if(existFile.createBy.toString()!=userId?.toString() && user.roles.includes("admin")!){
      throw new Error('You cannot delete this file!');
    }
    await cloudinary.uploader.destroy(existFile.publicId);
    await File.findByIdAndDelete(id);
    return {message:"Deleted!"}
  }catch(error){
    console.log(error);
    throw error;
  }
}