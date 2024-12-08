import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { deleteSticker } from "@/lib/actions/sticker.action";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { stickerId } = req.query;
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "DELETE") {
          if (typeof stickerId !== "string") {
            return res.status(400).json({ error: "Invalid sticker ID" });
          }
          if (!req.user?.id) {
            return res.status(401).json({ error: "You are unauthenticated!" });
          }
          const result = await deleteSticker(stickerId);

          return res.status(200).json(result);
        } else {
          return res.status(405).json({ error: "Method not allowed" });
        }
      });
    });
  });
}
