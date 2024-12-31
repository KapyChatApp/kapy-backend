import { removeUsers } from "@/lib/actions/user.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "DELETE") {
          try {
            const { userId } = req.query;
            if (!userId || typeof userId !== "string") {
              return res
                .status(400)
                .json({ message: "Invalid or missing userId" });
            }
            const updatedUser = await removeUsers(userId);

            if (!updatedUser) {
              return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json(updatedUser);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
          }
        } else {
          res.setHeader("Allow", ["DELETE"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    });
  });
}
