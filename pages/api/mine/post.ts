import { getSingleIdPosts } from "@/lib/actions/post.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () => authenticateToken(req, res, async () => {
    if (req.method === "GET") {
        try {
          if(!req.user || !req.user.id){
            throw new Error('You are unauthenticated!');
          }
          const myPosts = await getSingleIdPosts(req.user.id.toString());
        
          res.status(200).json(myPosts);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
}));
}
