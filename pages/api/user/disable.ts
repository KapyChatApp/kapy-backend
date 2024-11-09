import type { NextApiRequest, NextApiResponse } from "next";
import { disableUser } from "@/lib/actions/user.action";
import cors from "@/middleware/cors-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string } | { error: string }>
) {
  cors(req, res, async () => {
    const { id } = req.query;
    if (req.method === "PUT") {
      try {
        if (typeof id !== "string") {
          return res.status(400).json({ error: "Invalid user ID" });
        }

        const disabledUser = await disableUser(id);

        res.status(200).json({
          message: `User ${disabledUser._id} has been disabled successfully`
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.setHeader("Allow", ["PUT"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
