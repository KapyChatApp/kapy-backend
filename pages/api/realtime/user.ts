import { gelRealTimeOfUser } from "@/lib/actions/realtime.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const {userId} = req.query;
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        try {
            if (typeof userId !== "string") {
                return res.status(400).json({ error: "Invalid user ID" });
              }
          const users = await gelRealTimeOfUser(userId);
          res.status(200).json(users);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
