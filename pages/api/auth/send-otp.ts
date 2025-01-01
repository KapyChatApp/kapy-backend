import { sendSMS } from "@/lib/actions/authentication.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { phoneNumber } = req.query;
  cors(req, res, async () => {
      if (req.method === "POST") {
        if (!phoneNumber) {
          return res.status(400).json({ error: "Phone number is required" });
        }

        try {
          const sendedOTP = await sendSMS(phoneNumber.toString());
          console.log(sendedOTP);

          res.status(200).json(sendedOTP);
        } catch (error) {
          console.error("Error sending OTP:", error);
          res.status(500).json({ error: "Failed to send OTP" });
        }
      } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
}
