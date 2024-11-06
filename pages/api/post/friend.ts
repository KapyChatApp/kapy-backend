import { getFriendPosts} from "@/lib/actions/post.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const {friendId} = req.query;
  cors(req, res, () => authenticateToken(req, res, async () => {
    if (req.method === "GET") {
        try {
           
            if (typeof friendId !== "string") {
                return res.status(400).json({ error: "Invalid user ID" });
              }
          if(!req.user || !req.user.id){
            throw new Error('You are unauthenticated!');
          }
          const friendPosts = await getFriendPosts(friendId, req.user?.id);

          if(!friendPosts){
            return res.status(404).json({message:"You must be their bestfriend to see this content!"});
          }
          res.status(200).json(friendPosts);
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
