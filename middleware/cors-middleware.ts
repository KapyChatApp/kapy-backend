// middleware/cors-middleware.ts
import type { NextApiRequest, NextApiResponse } from "next";

const cors = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
  );

  // Nếu là preflight request, kết thúc sớm
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};

export default cors;
