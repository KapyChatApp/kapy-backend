import { checkToken } from "@/lib/actions/authentication.action";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { token } = req.body;
  const result = await checkToken(token);
  return res.status(200).json(result);
}
