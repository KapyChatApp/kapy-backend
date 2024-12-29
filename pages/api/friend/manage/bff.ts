import { getMyBFFs } from "@/lib/actions/mine.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import mongoose from "mongoose";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          try {
            const { userId } = req.query;
            if (!userId || typeof userId !== "string") {
              return res
                .status(400)
                .json({ message: "Invalid or missing userId" });
            }

            // Chuyển userId sang ObjectId
            const userIdRequest = new mongoose.Schema.Types.ObjectId(userId);
            const myBFFs = await getMyBFFs(userIdRequest);
            res.status(200).json(myBFFs);
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
