import { getSingleIdPosts } from "@/lib/actions/post.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () =>
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          try {
            const { userId } = req.query;
            const myPosts = await getSingleIdPosts(userId as string);

            res.status(200).json(myPosts);
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
          }
        } else {
          res.setHeader("Allow", ["GET"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    })
  );
}
