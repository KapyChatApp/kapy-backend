import { authenticateToken } from "@/middleware/auth-middleware";
import{ IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { addPost } from "@/lib/actions/post.action";

export const config = {
  api: {
    bodyParser: false, 
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        if (!req.user?.id) {
          return res.status(401).json({ error: "You are unauthenticated!" });
        }

        const form = new IncomingForm();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            return res.status(500).json({ error: err.message });
          }

          if (files.file) {
            try {
              const filesToUpload = Array.isArray(files.file) ? files.file : [files.file];

              const createdPost = await addPost(filesToUpload, fields.caption, req.user?.id);

              return res.status(200).json(createdPost);
            } catch (error) {
              console.error("Cloudinary upload error:", error);
              return res.status(500).json({ error: "Failed to upload" });
            }
          } else {
            return res.status(400).json({ error: "No files uploaded" });
          }
        });
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}
