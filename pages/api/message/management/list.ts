import { getAllMessage } from "@/lib/actions/message.action";
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
            const { success, messages } = await getAllMessage();

            if (!success) {
              return res
                .status(404)
                .json({ message: "Message list not found" });
            }

            res.status(200).json(messages);
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
  });
}
