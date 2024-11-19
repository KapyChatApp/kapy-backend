import { findMessages } from "@/lib/actions/message.action";
import cors from "@/middleware/cors-middleware";
import { NextApiResponse } from "next";
import { NextApiRequest } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    if (req.method === "GET") {
      const { boxId, query } = req.query;

      try {
        const result = await findMessages(boxId as string, query as string);

        return res.status(200).json(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "unknown error";
        return res.status(500).json({ success: false, message: errorMessage });
      }
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
