import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserLoginDTO } from "@/dtos/UserDTO";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import cors from "@/middleware/cors-middleware";

const SECRET_KEY = process.env.JWT_SECRET!;
export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const loginUser: UserLoginDTO = req.body;
    connectToDatabase();
    const existedUser = await User.findOne({
      phoneNumber: loginUser.phoneNumber
    });

    if (!existedUser) {
      throw new Error("Invalid phone number or password!");
    }

    const isPasswordValid = await bcrypt.compare(
      loginUser.password,
      existedUser.password
    );

    console.log(isPasswordValid, "isPasswordValid");

    if (!isPasswordValid) {
      throw new Error("Invalid phone number or password!");
    }

    const roles = existedUser.roles;
    const flag = existedUser.flag;
    const token =
      "Bearer " +
      jwt.sign(
        {
          id: existedUser.id,
          username: existedUser.phoneNumber,
          roles: existedUser.roles
        },
        SECRET_KEY
        // { expiresIn: "2h" }
      );

    return res.status(200).json({
      message: "Login successful",
      token,
      roles,
      flag
    });
  });
}
