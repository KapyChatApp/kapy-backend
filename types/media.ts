import { UploadApiResponse } from "cloudinary";

export interface UploadResults {
  images: UploadApiResponse[];
  videos: UploadApiResponse[];
  audios: UploadApiResponse[];
}
