import type { NextApiResponse } from "next";
import { serialize } from "cookie";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest } from "next/types";
import { inActiveDeviceInfo } from "@/lib/actions/authentication.action";
import { authenticateToken } from "@/middleware/auth-middleware";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      const { id } = req.query;
      if (typeof id !== "string") {
        return res.status(400).json({ error: "Invalid device ID" });
      }
      await inActiveDeviceInfo(req.user?.id, id);
      const cookie = serialize("auth", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: -1, //
        path: "/",
      });
      res.setHeader("Set-Cookie", cookie);
      const result: SingleMessageResponseDTO = {
        message: "Log out successfully",
      };
      res.status(200).json(result);
    });
  });
}
