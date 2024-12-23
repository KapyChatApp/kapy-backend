import { getMyBestFriendMapStatus } from "@/lib/actions/map-status.action";
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
          const bffMapStatus = await getMyBestFriendMapStatus(req.user?.id);
          return res.status(200).json(bffMapStatus);
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
