
import { getAllStickers} from "@/lib/actions/sticker.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () =>
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        try {
          const post = await getAllStickers();
          if (!post) {
            return res
              .status(404)
              .json({
                message: "Not found!",
              });
          }
          res.status(200).json(post);
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
