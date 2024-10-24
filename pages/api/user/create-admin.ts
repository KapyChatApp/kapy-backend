import { UserRegisterDTO } from "@/dtos/UserDTO";
import { createAdmin } from "@/lib/actions/user.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    authorizeRole(["admin"])(req, res, async () => {
      if (req.method === "POST") {
        try {
          const params: UserRegisterDTO = req.body;

          const newUser = await createAdmin(params, req.user?.id);

          return res.status(201).json(newUser);
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
}
