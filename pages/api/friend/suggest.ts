import { suggestFriends } from "@/lib/actions/friend.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        try {
          const userId = req.user?.id;
          const suggestProfile = await suggestFriends(userId);
          if (!suggestProfile) {
            return res.status(400).json({ message: "User not found!" });
          }
          return res.status(200).json(suggestProfile);
        } catch (error) {
          console.error(error);
          res.status(404).json({ message: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
