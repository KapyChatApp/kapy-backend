import { find } from "@/lib/actions/friend.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    const { q } = req.query;
    authenticateToken(req, res, async () => {
      if (typeof q !== "string") {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (req.method === "GET") {
        try {
          const userId = req.user?.id;
          const friendProfile = await find(q, userId);
          if (!friendProfile) {
            return res.status(400).json({ message: "User not found!" });
          }
          return res.status(200).json(friendProfile);
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
