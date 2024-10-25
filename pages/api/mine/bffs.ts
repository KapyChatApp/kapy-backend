import { getMyBFFs } from "@/lib/actions/mine.action";
import {
  authenticateToken,
} from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "GET") {
      try {
        const myBFFs = await getMyBFFs(req.user?.id);
        res.status(200).json(myBFFs);
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
