import { FriendRequestDTO } from "@/dtos/FriendDTO";
import { addFriend } from "@/lib/actions/friend.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "POST") {
      try {
        const param: FriendRequestDTO = req.body;
        if (param.sender !== (req.user?.id ?? "")) {
          throw new Error("You are unauthorized!");
        }
        const requestedRelation = await addFriend(param);
        return res.status(201).json(requestedRelation);
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
}
