import { offlineEvent } from "@/lib/actions/user.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        if (req.user && req.user.id) {
          const userId = req.user.id.toString();
          if (!userId) {
            return res
              .status(400)
              .json({ success: false, message: "userId is required" });
          }
          try {
            const result = await offlineEvent(userId);

            return res.status(200).json(result);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "unknown error";
            return res
              .status(500)
              .json({ success: false, message: errorMessage });
          }
        }
      } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
