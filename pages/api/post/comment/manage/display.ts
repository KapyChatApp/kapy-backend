import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { displayComment } from "@/lib/actions/comment.action";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          const { commentId } = req.query;
          if (typeof commentId !== "string") {
            return res.status(400).json({ error: "Invalid comment ID" });
          }
          const result = await displayComment(commentId);

          return res.status(200).json(result);
        } else {
          return res.status(405).json({ error: "Method not allowed" });
        }
      });
    });
  });
}
