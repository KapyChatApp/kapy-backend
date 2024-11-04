import cloudinary from "@/cloudinary";
import { authenticateToken } from "@/middleware/auth-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import { UploadApiResponse } from "cloudinary";
import File from "@/database/file.model";
import { CreateFileDTO } from "@/dtos/FileDTO";
import mongoose, { Schema } from "mongoose";
import { CreatePostDTO } from "@/dtos/PostFTO";
import User from "@/database/user.model";
import Post from "@/database/post.model";
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

interface UploadResults {
  images: UploadApiResponse[];
  videos: UploadApiResponse[];
  audios: UploadApiResponse[];
}

export default async function createPost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "POST") {
      if (!req.user?.id) {
        throw new Error("You are unauthenticated!");
      }
      const form = new IncomingForm();
      const contendIds: Schema.Types.ObjectId[] = [];
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          return res.status(500).json({ error: err.message });
        }

        if (files.file) {
          try {
            const filesToUpload = Array.isArray(files.file)
              ? files.file
              : [files.file];

            const uploadResults: UploadResults = {
              images: [],
              videos: [],
              audios: [],
            };

            // Lặp qua các tệp và phân loại chúng
            for (const file of filesToUpload) {
              const mimetype = file.mimetype; // Lấy loại tệp
              let result;

              if (mimetype?.startsWith("image/")) {
                // Upload hình ảnh
                result = await cloudinary.uploader.upload(file.filepath, {
                  folder: "Avatar",
                });
                uploadResults.images.push(result);
              } else if (mimetype?.startsWith("video/")) {
                // Upload video
                result = await cloudinary.uploader.upload(file.filepath, {
                  resource_type: "video",
                  folder: "Videos",
                });
                uploadResults.videos.push(result);
              } else if (mimetype?.startsWith("audio/")) {
                // Upload âm thanh
                result = await cloudinary.uploader.upload(file.filepath, {
                  resource_type: "raw",
                  folder: "Audios",
                });
                uploadResults.audios.push(result);
              } else {
                result = await cloudinary.uploader.upload(file.filepath, {
                  resource_type: "raw",
                  folder: "Documents",
                });
              }
            }

            for (const image of uploadResults.images) {
              const imageData: CreateFileDTO = {
                fileName: generateRandomString(),
                url: image.url,
                publicId: image.public_id,
                bytes: image.bytes,
                width: image.width,
                height: image.height,
                format: image.format,
                type: "Image",
              };
              const fileData = await Object.assign(imageData,{   createBy:req.user?.id? req.user?.id:new mongoose.Types.ObjectId})
              const createdImage = await File.create(fileData);
              contendIds.push(createdImage._id);
            }

            for (const video of uploadResults.videos) {
              const videoData: CreateFileDTO = {
                fileName: generateRandomString(),
                url: video.url,
                publicId: video.public_id,
                bytes: video.bytes,
                width: video.width,
                height: video.height,
                format: video.format,
                type: "Video",
              };
              const fileData = await Object.assign(videoData,{   createBy:req.user?.id? req.user?.id:new mongoose.Types.ObjectId})
              const createdVideo = await File.create(fileData);
              contendIds.push(createdVideo._id);
            }

            for (const audio of uploadResults.videos) {
              const audioData: CreateFileDTO = {
                fileName: generateRandomString(),
                url: audio.url,
                publicId: audio.public_id,
                bytes: audio.bytes,
                width: audio.width,
                height: audio.height,
                format: audio.format,
                type: "Audio",
              };
              const fileData = await Object.assign(audioData,{   createBy:req.user?.id? req.user?.id:new mongoose.Types.ObjectId})
              const createdAudio = await File.create(fileData);
              contendIds.push(createdAudio._id);
            }

            for (const other of uploadResults.videos) {
              const otherData: CreateFileDTO = {
                fileName: generateRandomString(),
                url: other.url,
                publicId: other.public_id,
                bytes: other.bytes,
                width: other.width,
                height: other.height,
                format: other.format,
                type: "Other",
              };
              const fileData = await Object.assign(otherData,{   createBy:req.user?.id? req.user?.id:new mongoose.Types.ObjectId})
              const createdOther = await File.create(fileData);
              contendIds.push(createdOther._id);
            }

            const postData: CreatePostDTO = {
              userId: req.user?.id,
              caption: fields.caption ? fields.caption.toString() : "",
              contentIds: contendIds,
            };

            const createdPost = await Post.create(postData);
            const user = await User.findById(req.user?.id);
            await user.contendIds.addToSet(createdPost._id);
            await user.save();
            return res.status(200).json(createdPost);
          } catch (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Failed to upload" });
          }
        } else {
          return res.status(400).json({ error: "No file uploaded" });
        }
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  });
}
