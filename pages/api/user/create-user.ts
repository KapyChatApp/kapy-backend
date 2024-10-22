import { CreateUserDTO } from "@/dtos/UserDTO";
import { createUser } from "@/lib/actions/user.action";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const params: CreateUserDTO = req.body;

      const newUser = await createUser(params, req.user?.id);

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
