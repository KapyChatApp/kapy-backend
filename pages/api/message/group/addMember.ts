import { addMember } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        const { boxId, newMember } = req.body;

        // Kiểm tra tính hợp lệ của các tham số
        if (!boxId || !Array.isArray(newMember) || newMember.length === 0) {
          return res.status(400).json({
            success: false,
            message: "boxId and newMember (array) are required"
          });
        }

        try {
          const userId = req.user?.id;
          if (!userId) {
            return res
              .status(401)
              .json({ success: false, message: "User is not authenticated" });
          }

          // Gọi action addMember để thêm thành viên vào nhóm
          const result = await addMember(userId.toString(), newMember, boxId);

          return res.status(200).json(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return res
            .status(500)
            .json({ success: false, message: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
