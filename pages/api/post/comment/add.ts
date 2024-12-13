import { authenticateToken } from "@/middleware/auth-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { createComment } from "@/lib/actions/comment.action";
import { CreateCommentDTO } from "@/dtos/CommentDTO";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const {replyId, targetType} = req.query;
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        if (!req.user?.id) {
          return res.status(401).json({ error: "You are unauthenticated!" });
        }
        if (typeof replyId !== "string" || typeof targetType !== "string" ) {
            return res.status(400).json({ error: "Invalid user ID" });
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
                const commentData:CreateCommentDTO ={
                    filesToUpload:filesToUpload[0],
                    caption:fields.caption?.toString(),
                    userId:req.user?.id,
                    replyId:replyId,
                    targetType:targetType
                }
              const createdComment = await createComment(commentData);
              return res.status(200).json(createdComment);
            } catch (error) {
              console.error("Cloudinary upload error:", error);
              return res.status(500).json({ error: "Failed to upload" });
            }
          } else {
            const commentData:CreateCommentDTO ={
                filesToUpload:null,
                caption:fields.caption?.toString(),
                userId:req.user?.id,
                replyId:replyId,
                targetType:targetType
            }
            const createdComment = await createComment(commentData);

            return res.status(200).json(createdComment);
          }
        });
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}
