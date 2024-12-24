import { deleteBox } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware"; // Authentication middleware
import cors from "@/middleware/cors-middleware"; // CORS middleware
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "DELETE") {
        const { boxId } = req.query;

        if (!boxId || typeof boxId !== "string") {
          return res.status(400).json({
            success: false,
            message: "boxId is required and must be a string"
          });
        }

        try {
          const userId = req.user?.id;
          if (!userId) {
            return res
              .status(401)
              .json({ success: false, message: "User is not authenticated" });
          }

          const result = await deleteBox(userId.toString(), boxId);

          return res.status(200).json(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "unknown error";
          return res
            .status(500)
            .json({ success: false, message: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
