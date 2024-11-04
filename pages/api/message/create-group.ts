import { createGroup } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await authenticateToken(req, res, async () => {
    if (req.method === "POST") {
      const { membersIds, leaderId, groupName, groupAva } = req.body;
      if (!Array.isArray(membersIds) || membersIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "membersIds must be a non-empty array"
        });
      }
      if (!leaderId) {
        return res
          .status(400)
          .json({ success: false, message: "leaderId is required" });
      }

      try {
        const result = await createGroup(
          membersIds,
          leaderId,
          groupName,
          groupAva
        );

        return res.status(200).json({ success: true, data: result });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "unknown error";
        return res.status(500).json({ success: false, message: errorMessage });
      }
    } else {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
