import type { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;
declare module "next" {
  interface NextApiRequest {
    user?: JwtPayload | { id: number; username: string };
  }
}
interface DecodedToken extends JwtPayload {
  id: string;
  username: string;
}

export function authenticateToken(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Access token is missing" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as DecodedToken;
    req.user = decoded;
    next();
  } catch (error) {
    throw error;
    return res.status(403).json({ message: "Invalid token" });
  }
}
