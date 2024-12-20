import { findBoxChat } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiResponse } from "next";
import { NextApiRequest } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "GET") {
        try {
          const { receiverId } = req.query;
          if (!receiverId) {
            return res
              .status(400)
              .json({ success: false, message: "Receiver ID is required" });
          }
          if (req.user && req.user.id) {
            const userId = req.user.id.toString();
            if (!userId) {
              return res.status(400).json({ message: "userId is required" });
            }
            const result = await findBoxChat(
              userId as string,
              receiverId as string
            );
            res.status(200).json(result);
          }
        } catch (error) {
          console.error("Error fetching boxId: ", error);
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
