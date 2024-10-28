import { SegmentMessageDTO } from "@/dtos/MessageDTO";
import { fetchMessage } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    SegmentMessageDTO[] | { message: string; error?: string }
  >
) {
  authenticateToken(req, res, async () => {
    if (req.method === "GET") {
      try {
        const { boxId } = req.query;
        if (!boxId) {
          return res
            .status(400)
            .json({ message: "chatId or groupId is required" });
        }

        const { success, messages } = await fetchMessage(boxId as string);

        if (!success) {
          return res.status(404).json({ message: "Messages not found" });
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
}
