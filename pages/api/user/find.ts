
import { findUser } from "@/lib/actions/user.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  authenticateToken(req, res, async () => {
    if (req.method === "GET") {
      const { phonenumber } = req.query;
      try {
        if (typeof phonenumber !== "string") {
          return res.status(400).json({ error: "Invalid user ID" });
        }
        const result= await findUser(phonenumber, req.user?.id);
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  });
}
