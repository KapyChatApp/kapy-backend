import cloudinary from "@/clouduonary";
import { uploadBackground } from "@/lib/actions/media.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next";

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

        const uploadBackgroundRes = await uploadBackground(
          req.user?.id,
          uploadedResponse.secure_url,
          uploadedResponse.public_id
        );
        res.status(200).json(uploadBackgroundRes);
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
