import { EditCommentDTO } from "@/dtos/CommentDTO";
import { editComment } from "@/lib/actions/comment.action";
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
  const { commentId } = req.query;
  const commentIdString = Array.isArray(commentId) ? commentId[0] : commentId;

  if (!commentIdString) {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PATCH") {
        try {
          const form = formidable() 
          form.parse(req, async (err, fields, files) => {
            if (err) {
              console.error(err);
              return res.status(400).json({ error: "Invalid form data" });
            }
            const params: EditCommentDTO = {
                caption: fields.caption ? String(fields.caption) : "",
                keepOldContent: 
    Array.isArray(fields.keepOldContent) // Check if it's an array
      ? false  // Handle this case however you want (e.g., false by default)
      : fields.keepOldContent === "true",
                content: files.content ? (Array.isArray(files.content) ? files.content[0] : files.content) : null,

              };

            const editedComment = await editComment(
              commentIdString,
              req.user?.id,
              params
            );

            res.status(200).json(editedComment);
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
