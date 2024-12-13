import { EditPostDTO } from "@/dtos/PostDTO";
import { editPost } from "@/lib/actions/post.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import formidable from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
    api: {
      bodyParser: false,
    },
  };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const {postId} = req.query;
    const postIdString = Array.isArray(postId) ? postId[0] : postId;

  if (!postIdString) {
    return res.status(400).json({ error: "Post ID is required" });
  }
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PATCH") {
        try {
            const form = new formidable.IncomingForm();
            form.parse(req, async (err, fields, files) => {
              if (err) {
                console.error(err);
                return res.status(400).json({ error: "Invalid form data" });
              }
  
              // Map dữ liệu từ FormData sang EditPostDTO
              const params: EditPostDTO = {
                caption: fields.caption ? String(fields.caption) : "",
                remainContentIds: fields.remainContentIds? fields.remainContentIds : [],
                contents: files?.file ? (Array.isArray(files.file) ? files.file : [files.file]) : []
              };
  
              // Gọi hàm `editPost`
              const editedPost = await editPost(
                postIdString,
                req.user?.id,
                params
              );
  
              res.status(200).json(editedPost);
            });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["PATCH"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
