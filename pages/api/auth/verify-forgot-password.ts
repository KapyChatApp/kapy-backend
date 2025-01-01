import OTP from "@/database/opt.mode";
import { SingleMessageResponseDTO } from "@/dtos/ShareDTO";
import { changePassword, forgotPassword } from "@/lib/actions/authentication.action";
import { connectToDatabase } from "@/lib/mongoose";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    cors(req, res, async () => {
         if (req.method === "PATCH") {
                const { otp,phoneNumber, newPassword } = req.body;
                const result = await forgotPassword(otp, phoneNumber, newPassword);
                return res.status(200).json(result);
            } else {
                res.setHeader("Allow", ["PATH"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
            }
    });
}
