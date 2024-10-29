import { getFriendProfile } from "@/lib/actions/profile.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { friendId } = req.query;
  authenticateToken(req, res, async () => {
    if (typeof friendId !== "string") {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (req.method === "GET") {
      try {
        const userId = req.user?.id;
        const friendProfile = await getFriendProfile(friendId, userId);
        return res.status(200).json(friendProfile);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
