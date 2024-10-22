import { UserResponseDTO } from "@/dtos/UserDTO";
import { getAllUsers } from "@/lib/actions/user.action";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponseDTO[] | { message: string }>
) {
  if (req.method === "GET") {
    try {
      const users = await getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
