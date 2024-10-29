import { UpdateUserDTO } from "@/dtos/UserDTO";
import { updateUser } from "@/lib/actions/user.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "PATCH") {
      try {
        const params: UpdateUserDTO = req.body;
        const updatedUser = await updateUser(req.user?.id, params);

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res
          .status(200)
          .json(updatedUser);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.setHeader("Allow", ["PATCH"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
