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
  const { postId } = req.query;
  const postIdString = Array.isArray(postId) ? postId[0] : postId;

  if (!postIdString) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PATCH") {
        try {
          // Dùng `formidable` trực tiếp như một hàm
          const form = formidable() // Không cần phải sửa `IncomingForm`
          form.parse(req, async (err, fields, files) => {
            if (err) {
              console.error(err);
              return res.status(400).json({ error: "Invalid form data" });
            }
            let parsedTagIds: string[] = [];
          
            if (fields.tagIds) {
              if (Array.isArray(fields.tagIds)) {
                // Handle case where it's already an array
                parsedTagIds = fields.tagIds.flatMap(item => {
                  try {
                    // Try to parse each item if it's a JSON string
                    const parsed = JSON.parse(item);
                    return Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    // If not valid JSON, use as is
                    console.log("err parsing tagIds: ",e);
                    return [item];
                  }
                });
              } else if (typeof fields.tagIds === "string") {
                try {
                  // Try to parse as JSON
                  const parsed = JSON.parse(fields.tagIds);
                  parsedTagIds = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  // Not valid JSON, use as single item
                  console.log("err parsing tagIds: ",e);
                  parsedTagIds = [fields.tagIds];
                }
              }
            }
            // Map dữ liệu từ FormData sang EditPostDTO
            const params: EditPostDTO = {
              caption: fields.caption ? String(fields.caption) : "",
              remainContentIds: fields.remainContentIds ? fields.remainContentIds : [],
              contents: files?.file ? (Array.isArray(files.file) ? files.file : [files.file]) : [],
              tagIds:parsedTagIds,
              musicName:fields.musicName? fields.musicName.toString() : "",
              musicURL:fields.musicURL? fields.musicURL.toString() : "",
              musicAuthor:fields.musicAuthor? fields.musicAuthor.toString() : "",
              musicImageURL:fields.musicImageURL? fields.musicImageURL.toString():""
            };

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
