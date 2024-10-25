import { SegmentGroupDTO, SegmentMessageDTO } from "@/dtos/MessageDTO";
import { createMessage } from "@/lib/actions/message.action";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next/types";

const SECRET_KEY = process.env.JWT_SECRET!;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      decoded = jwt.verify(token, SECRET_KEY);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const data: SegmentMessageDTO | SegmentGroupDTO = req.body;

    const result = await createMessage(data, req.user?.id);

    const responseToken =
      "Bearer " +
      jwt.sign(
        {
          message: result.message,
          chat: result.chat,
          groupChat: result.groupChat
        },
        SECRET_KEY,
        { expiresIn: "2h" }
      );

    return res.status(200).json({
      message: "Send message successfully.",
      responseToken
    });
  } catch (error) {
    console.error("Error sending message: ", error);
    return res.status(500).json({ success: false, message: error });
  }
}
