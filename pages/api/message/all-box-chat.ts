import { fetchBoxChat } from "@/lib/actions/message.action";
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
        try {
          const { userId } = req.query;
          if (!userId) {
            return res.status(400).json({ message: "userId is required" });
          }
          const result = await fetchBoxChat(userId as string);
          res.status(200).json({ success: true, box: result });
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
