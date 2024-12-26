import { disbandGroup } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "DELETE") {
        const { boxId } = req.query;

        if (!boxId) {
          return res
            .status(400)
            .json({ success: false, message: "Box ID is required" });
        }

        try {
          const userId = req.user?.id;
          if (!userId) {
            return res
              .status(401)
              .json({ success: false, message: "User is not authenticated" });
          }

          // Call disbandGroup action
          const result = await disbandGroup(userId.toString(), boxId as string);

          return res.status(200).json(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return res
            .status(500)
            .json({ success: false, message: errorMessage });
        }
      } else {
        res.setHeader("Allow", ["DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
