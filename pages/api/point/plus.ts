import { addPoint } from "@/lib/actions/community.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "PATCH") {
          try {
            const userId = Array.isArray(req.query.userId)
              ? req.query.userId[0]
              : req.query.userId;
            const point = Array.isArray(req.query.point)
              ? parseInt(req.query.point[0], 10)
              : parseInt(req.query.point as string, 10);

            const result = await addPoint(userId, point);
            return res.status(200).json(result);
          } catch (error) {
            console.error(error);

            if (error instanceof Error) {
              return res.status(400).json({ message: error.message });
            }
            return res
              .status(500)
              .json({ message: "An unexpected error occurred." });
          }
        } else {
          return res.status(405).json({ message: "Method Not Allowed" });
        }
      });
    });
  });
}
