import { checkMarkMessageAsRead } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        const { boxIds } = req.body;

        if (!boxIds || !Array.isArray(boxIds)) {
          return res.status(400).json({
            success: false,
            message: "Chat ID is required and Chat must be an array"
          });
        }

        if (req.user && req.user.id) {
          const userId = req.user.id.toString();
          if (!userId) {
            return res
              .status(400)
              .json({ success: false, message: "UserId is required" });
          }
          try {
            const result = await checkMarkMessageAsRead(boxIds, userId);
            return res.status(200).json(result);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "unknown error";
            return res
              .status(500)
              .json({ success: false, message: errorMessage });
          }
        }
      } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
