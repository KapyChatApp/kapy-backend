import { JwtPayload } from "jsonwebtoken";
import { Schema } from "mongoose";

export interface DecodedToken extends JwtPayload {
  id?: Schema.Types.ObjectId;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
