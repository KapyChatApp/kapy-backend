import type { NextApiRequest, NextApiResponse } from "next";
import { uploadAvatar } from "@/lib/actions/media.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cloudinary from "@/cloudinary";
import { IncomingForm } from "formidable";

export const config = {
  api: {
    bodyParser: false, // Tắt body parser để sử dụng formidable
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  authenticateToken(req, res, async () => {
    if (req.method === "POST") {
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err); // Log lỗi phân tích cú pháp
          return res.status(500).json({ error: err.message });
        }

        if (files.file) {
          try {
            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            const result = await cloudinary.uploader.upload(file.filepath, {
              folder: "Avatar",
            });

            await uploadAvatar(req.user?.id, result.secure_url, result.public_id);
            return res.status(200).json({ url: result.secure_url });
          } catch (error) {
            console.error("Cloudinary upload error:", error); // Log lỗi tải lên Cloudinary
            return res.status(500).json({ error: "Failed to upload image" });
          }
        } else {
          return res.status(400).json({ error: "No file uploaded" });
        }
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  });
};

export default handler;
