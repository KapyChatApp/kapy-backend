import { countUsersByAttendDate } from "@/lib/actions/user.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          try {
            const userCount = await countUsersByAttendDate();
            return res.status(200).json(userCount);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            return res.status(500).json({ error: error.message });
          }
        } else {
          return res.status(405).json({ message: "Method Not Allowed" });
        }
      });
    });
  });
};

export default handler;
