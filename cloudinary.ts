import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.uploader.upload(
  "https://console.cloudinary.com/pm/c-882c79dac4ba6fdb9cd02c9b4578e6/media-explorer/Avatar",
  {
    folder: "Avatar" // Đảm bảo ảnh được upload vào thư mục Avatar
  },
  (error, result) => {
    if (error) {
      console.error("Upload failed:", error);
    } else {
      console.log("Upload success:", result ? result.secure_url : "");
    }
  }
);

export default cloudinary;
