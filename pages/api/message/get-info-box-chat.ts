import { fetchOneBoxChat } from "@/lib/actions/message.action";
import { NextApiRequest, NextApiResponse } from "next/types";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        const { boxId } = req.query;
        try {
          if (!boxId) {
            return res.status(400).json({ message: "boxId is required" });
          }
          if (req.user && req.user.id) {
            const userId = req.user.id.toString();
            if (!userId) {
              return res
                .status(400)
                .json({ success: false, message: "UserId is required" });
            }
            const result = await fetchOneBoxChat(boxId as string, userId);
            res.status(200).json(result);
          }
        } catch (error) {
          console.error("Error fetching messageBox: ", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          res
            .status(500)
            .json({ message: "Internal Server Error", error: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["GET", "OPTIONS"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
