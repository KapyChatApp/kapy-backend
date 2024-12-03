import { fetchMessage } from "@/lib/actions/message.action";
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
          const { boxId } = req.query;
          if (!boxId) {
            return res
              .status(400)
              .json({ message: "chatId or groupId is required" });
          }
          if (req.user && req.user.id) {
            const userId = req.user.id.toString();
            if (!userId) {
              return res.status(400).json({ message: "userId is required" });
            }
            const result = await fetchMessage(
              boxId as string,
              userId as string
            );
            res.status(200).json(result);
          }
        } catch (error) {
          console.error("Error fetching messages: ", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          res
            .status(500)
            .json({ message: "Internal Server Error", error: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
