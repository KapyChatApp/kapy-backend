import { getDetailLikeOfPost } from "@/lib/actions/like.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () =>
    authenticateToken(req, res, async () => {
        if (req.method === "GET") {
          try {
            const { postId } = req.query;

            if (!postId || Array.isArray(postId)) {
              return res.status(400).json({ message: "Invalid postId" });
            }

            const likeDetail = await getDetailLikeOfPost(postId);

            res.status(200).json(likeDetail);
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
          }
        } else {
          res.setHeader("Allow", ["GET"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    })
  );
}
