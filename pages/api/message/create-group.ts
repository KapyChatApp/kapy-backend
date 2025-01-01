import cloudinary from "@/cloudinary";
import { createGroup } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";

export const config = {
  api: {
    bodyParser: false // Important: Disabling body parser to handle multipart form data
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        const form = new IncomingForm();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error("Formidable parse error:", err);
            return res.status(500).json({
              success: false,
              message: "Error parsing the form data"
            });
          }
          console.log("Form parsed successfully."); // Log khi phân tích form thành công
          console.log("Fields:", fields); // Log nội dung fields nhận được
          console.log("Files:", files);

          const membersIds = Array.isArray(fields.membersIds)
            ? JSON.parse(fields.membersIds[0] as string)
            : [];
          if (
            !Array.isArray(membersIds) ||
            membersIds.some((id) => typeof id !== "string")
          ) {
            return res.status(400).json({
              success: false,
              message: "membersIds must be a non-empty array of strings"
            });
          }

          const groupName =
            Array.isArray(fields.groupName) && fields.groupName[0]
              ? fields.groupName[0]
              : "NewGroup";

          if (typeof groupName !== "string") {
            return res.status(400).json({
              success: false,
              message: "groupName must be a valid string"
            });
          }

          if (!req.user || !req.user.id) {
            return res.status(401).json({
              success: false,
              message: "Unauthorized: Missing user information"
            });
          }

          const userId = req.user.id.toString();

          try {
            let groupAvaUrl = "";

            // Kiểm tra xem có file groupAva được gửi hay không
            if (files.file) {
              const file = Array.isArray(files.file)
                ? files.file[0]
                : files.file;
              const uploadResult = await cloudinary.uploader.upload(
                file.filepath,
                {
                  folder: "Avatar"
                }
              );

              groupAvaUrl = uploadResult.secure_url;
            }

            // Tạo group với các thông tin đã xử lý
            const result = await createGroup(
              membersIds,
              userId,
              groupName,
              groupAvaUrl
            );

            return res.status(200).json({ result });
          } catch (error) {
            console.error(
              "Error while uploading to Cloudinary or creating group:",
              error
            );

            return res.status(500).json({
              success: false,
              message: "An error occurred during processing"
            });
          }
        });
      } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
