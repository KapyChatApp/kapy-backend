import { getMyAuthHistoryOfUser } from "@/lib/actions/authentication.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (typeof id !== "string") {
          return res.status(400).json({ error: "Invalid user ID" });
        }
        if (req.method === "GET") {
          try {
            const authHistories = await getMyAuthHistoryOfUser(id);
            res.status(200).json(authHistories);
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
          }
        } else {
          res.setHeader("Allow", ["GET"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    });
  });
}
