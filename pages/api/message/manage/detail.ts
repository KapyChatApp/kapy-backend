import { getDetailMessage } from "@/lib/actions/message.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          try {
            const { messageId } = req.query;
            if (!messageId) {
              return res
                .status(400)
                .json({ message: "Message Id is required" });
            }

            const result = await getDetailMessage(messageId.toString());

            if (result) {
              res.status(200).json(result);
            } else {
              return res.status(404).json({
                success: false,
                message: "Message not found or can be removed"
              });
            }
          } catch (error) {
            console.error("Error removing messages: ", error);
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
  });
}
