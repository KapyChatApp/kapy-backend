
import { disLike } from "@/lib/actions/like.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { postId } = req.query;
    cors(req, res, () => {
      authenticateToken(req, res, async () => {
        try {
          if (typeof postId !== "string") {
            return res.status(400).json({ error: "Invalid user ID" });
          }
          const result = await disLike(postId, req.user?.id);
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
