import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { addPost } from "@/lib/actions/post.action";
import { updateSticker } from "@/lib/actions/sticker.action";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "PATCH") {
          if (!req.user?.id) {
            return res.status(401).json({ error: "You are unauthenticated!" });
          }
          const { stickerId } = req.query;
          if (typeof stickerId !== "string") {
            return res.status(400).json({ error: "Invalid stickerId" });
          }
          const form = new IncomingForm();

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

                const sticker = await updateSticker(
                  fields.name?.toString(),
                  stickerId,
                  req.user?.id,
                  filesToUpload[0]
                );
                return res.status(200).json(sticker);
              } catch (error) {
                console.error("Cloudinary upload error:", error);
                return res.status(500).json({ error: "Failed to upload" });
              }
            } else {
              const createdPost = await addPost(
                [],
                fields.caption,
                req.user?.id
              );

              return res.status(200).json(createdPost);
            }
          });
        } else {
          return res.status(405).json({ error: "Method not allowed" });
        }
      });
    });
  });
}
