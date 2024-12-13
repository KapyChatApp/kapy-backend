import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { deleteComment } from "@/lib/actions/comment.action";

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
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "DELETE") {
        if (typeof commentId !== "string") {
          return res.status(400).json({ error: "Invalid post ID" });
        }
        if (!req.user?.id) {
          return res.status(401).json({ error: "You are unauthenticated!" });
        }
        const result = await deleteComment(commentId, req.user?.id);
        
        return res.status(200).json(result);
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}
