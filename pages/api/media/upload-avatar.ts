import type { NextApiRequest, NextApiResponse } from "next";
import { uploadAvatar } from "@/lib/actions/media.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cloudinary from "@/cloudinary";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "POST") {
      try {
        const fileStr = req.body.data;

        const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
          upload_preset: "Avatar",
        });

        const uploadAvatarRes = await uploadAvatar(
          req.user?.id,
          uploadedResponse.secure_url,
          uploadedResponse.public_id
        );
        res.status(200).json(uploadAvatarRes);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Có lỗi xảy ra trong quá trình upload ảnh" });
      }
    } else {
      res.status(405).json({ message: "Phương thức không được hỗ trợ" });
    }
  });
}
