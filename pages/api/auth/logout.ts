import type { NextApiResponse } from "next";
import { serialize } from "cookie";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest } from "next/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(req, res, async () => {
    const cookie = serialize("auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: -1, //
      path: "/"
    });

    res.setHeader("Set-Cookie", cookie);
    const result: SingleMessageResponseDTO = {
      message: "Log out successfully"
    };
    res.status(200).json(result);
  });
}
