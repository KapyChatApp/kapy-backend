import type { NextApiResponse } from "next";
import { serialize } from "cookie";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";

export default function handler(res: NextApiResponse) {
  const cookie = serialize("auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, //
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  const result: SingleMessageResponseDTO = { message: "Log out successfully" };
  res.status(200).json(result);
}
