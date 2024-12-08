import { getASticker } from "@/lib/actions/sticker.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { stickerId } = req.query;
  cors(req, res, () =>
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        try {
          if (typeof stickerId !== "string") {
            return res.status(400).json({ error: "Invalid sticker ID" });
          }
          const stickers = await getASticker(stickerId);
          if (!stickers) {
            return res.status(404).json({
              message: "Not found!",
            });
          }
          res.status(200).json(stickers);
        } catch (error) { 
          console.error(error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    })
  );
}