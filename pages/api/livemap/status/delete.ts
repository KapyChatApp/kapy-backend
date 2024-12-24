import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { deleteStatus } from "@/lib/actions/map-status.action";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "DELETE") {
        const result = await deleteStatus(req.user?.id);
        return res.status(200).json(result);
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}
