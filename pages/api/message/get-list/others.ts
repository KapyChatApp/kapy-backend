import { getOtherList } from "@/lib/actions/message.action";
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
        const { boxId } = req.query;
        try {
          if (!boxId) {
            return res.status(400).json({ message: "boxId is required" });
          }
          const result = await getOtherList(boxId as string);
          res.status(200).json(result);
        } catch (error) {
          console.error("Error get other list of this message box: ", error);
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
