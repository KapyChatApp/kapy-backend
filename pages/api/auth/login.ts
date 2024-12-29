import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserLoginDTO } from "@/dtos/UserDTO";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import cors from "@/middleware/cors-middleware";
import { CreateAuthDTO } from "@/dtos/AuthDTO";
import { createDeviceInfo } from "@/lib/actions/authentication.action";

const SECRET_KEY = process.env.JWT_SECRET!;
export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const loginUser: UserLoginDTO = req.body;
    connectToDatabase();
    const existedUser = await User.findOne({
      phoneNumber: loginUser.phoneNumber,
    });
    if (!existedUser) {
      return res
        .status(401)
        .json({ message: "Invalid phone number or password!" });
    }
    if(!existedUser.flag){
      return res.status(601).json({message: "Your account has been locked!"})
    }

    const isPasswordValid = await bcrypt.compare(
      loginUser.password,
      existedUser.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid phone number or password!" });
    }

    if (!isPasswordValid) {
      throw new Error("Invalid phone number or password!");
    }

    const token =
      "Bearer " +
      jwt.sign(
        {
          id: existedUser.id,
          username: existedUser.phoneNumber,
          roles: existedUser.roles,
        },
        SECRET_KEY,
        { expiresIn: "100h" }
      );
    const deviceInfo: CreateAuthDTO = {
      deviceName: loginUser.deviceName,
      deviceType: loginUser.deviceType,
      brand: loginUser.brand,
      modelName: loginUser.modelName,
      osName: loginUser.osName,
      osVersion: loginUser.osVersion,
      region: loginUser.region,
    };
    const device = await createDeviceInfo(existedUser._id, deviceInfo);
    return res.status(200).json({
      message: "Login successful",
      token,
      device: device,
    });
  });
}
