import { UpdatePasswordDTO } from "@/dtos/UserDTO";
import { updatePassword } from "@/lib/actions/user.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PATCH") {
        try {
          const params: UpdatePasswordDTO = req.body;
          const updatedUser = await updatePassword(req.user?.id, params);

          if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
          }

          res.status(200).json(updatedUser);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["PATCH"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
