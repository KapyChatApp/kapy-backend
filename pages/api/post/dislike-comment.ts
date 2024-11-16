
import { disLikeComment } from "@/lib/actions/comment.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";
export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { commentId } = req.query;
    cors(req, res, () => {
      authenticateToken(req, res, async () => {
        try {
          if (typeof commentId !== "string") {
            return res.status(400).json({ error: "Invalid user ID" });
          }
          const result = await disLikeComment(commentId, req.user?.id);
          return res.status(200).json(result);
        } catch (error) {
          console.error(error);
        }
      });
    });
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
