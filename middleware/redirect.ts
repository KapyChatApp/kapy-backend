// pages/api/check-login.ts

import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token;

  if (token) {
    return res.status(200).json({ redirect: "/chat" });
  } else {
    return res.status(200).json({ redirect: "/" });
  }
}
