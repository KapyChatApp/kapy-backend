import { editMessage } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PUT") {
        try {
          const { messageId, newContent, userId } = req.body as {
            messageId: string;
            newContent: string;
            userId: string;
          };
          if (!messageId) {
            return res
              .status(400)
              .json({ success: false, message: "Message ID is required" });
          }

          const result = await editMessage(
            messageId as string,
            newContent,
            userId
          );
          return res.status(200).json(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          res
            .status(500)
            .json({ message: "Error editing message", error: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["PUT"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
