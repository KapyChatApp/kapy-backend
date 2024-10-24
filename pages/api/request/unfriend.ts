import { FriendRequestDTO } from "@/dtos/FriendDTO";
import { unFriend } from "@/lib/actions/friend.action";
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
        await unFriend(param);
        return res.status(201).json({ message: "Unfriend successfully!" });
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
