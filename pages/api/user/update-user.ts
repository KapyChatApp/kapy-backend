import { UpdateUserDTO } from "@/dtos/UserDTO";
import { updateUser } from "@/lib/actions/user.action";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    try {
      if (typeof id !== "string") {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const params: UpdateUserDTO = req.body;

      const updatedUser = await updateUser(id, params);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res
        .status(200)
        .json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
