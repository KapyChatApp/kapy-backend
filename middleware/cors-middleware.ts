import { NextApiRequest, NextApiResponse } from "next";
export default function cors(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
}
