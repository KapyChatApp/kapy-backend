import { FriendRequestDTO } from "@/dtos/FriendDTO";
import { acceptFriendRequest } from "@/lib/actions/friend.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        try {
          const param: FriendRequestDTO = req.body;
          if (param.receiver !== (req.user?.id ?? "")) {
            throw new Error("You are unauthorized!");
          }
          const acceptedRelation = await acceptFriendRequest(param);
          return res.status(201).json(acceptedRelation);
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
