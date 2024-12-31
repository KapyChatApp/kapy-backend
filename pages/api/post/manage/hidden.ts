import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { hiddenPost } from "@/lib/actions/post.action";

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
        if (req.method === "DELETE") {
          const { postId } = req.query;
          if (typeof postId !== "string") {
            return res.status(400).json({ error: "Invalid post ID" });
          }
          const result = await hiddenPost(postId);

          return res.status(200).json(result);
        } else {
          return res.status(405).json({ error: "Method not allowed" });
        }
      });
    });
  });
}
