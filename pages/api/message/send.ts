import { SegmentMessageDTO } from "@/dtos/MessageDTO";
import { createMessage } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }

      try {
        const data: SegmentMessageDTO = req.body;

        const result = await createMessage(data);

        return res.status(200).json({
          message: "Send message successfully.",
          result
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "unknown error";
        return res.status(500).json({ success: false, message: errorMessage });
      }
    });
  });
}
