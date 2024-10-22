import type { NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(res: NextApiResponse) {
  const cookie = serialize("auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // 
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ message: "Logout successful" });
}
