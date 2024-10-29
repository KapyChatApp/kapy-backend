import { searchMessages } from "@/lib/actions/message.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { NextApiResponse } from "next";
import { NextApiRequest } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    authorizeRole(["admin"])(req, res, async () => {
      if (req.method === "GET") {
        const { id, query } = req.query;

        try {
          const result = await searchMessages(
            id as string | undefined,
            query as string | undefined
          );

          return res.status(200).json(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "unknown error";
          return res
            .status(500)
            .json({ success: false, message: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
