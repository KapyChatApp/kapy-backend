import { RequestSendMessageDTO } from "@/dtos/MessageDTO";
import { createMessage } from "@/lib/actions/message.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }

      const form = new IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "File parsing error" });
        }

        console.log("Form parsed successfully."); // Log khi phân tích form thành công
        console.log("Fields:", fields); // Log nội dung fields nhận được
        console.log("Files:", files);

        try {
          // Chuyển đổi `fields` thành `RequestSendMessage`
          if (req.user && req.user.id) {
            const userId = req.user.id.toString();
            if (userId) {
              // const receiverId = Array.isArray(fields.recipientId)
              //   ? fields.recipientId[0]
              //   : "";
              // const receiverIdsArray = receiverId
              //   ? receiverId.split(",").map((id) => id.trim())
              //   : [];
              const data: RequestSendMessageDTO = {
                boxId: Array.isArray(fields.boxId) ? fields.boxId[0] : "",
                content: JSON.parse(fields.content as unknown as string),
                time: new Date()
                //recipientId: receiverIdsArray
              };
              console.log("Parsed data:", data);

              // Gọi hàm createMessage và truyền các trường đã xử lý
              const result = await createMessage(data, files, userId);
              console.log("Message sent successfully:", result);

              return res.status(200).json({
                message: "Send message successfully.",
                result
              });
            }
          } else {
            return res.status(400).json({ message: "userId is required" });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "unknown error";
          return res
            .status(500)
            .json({ success: false, message: errorMessage });
        }
      });
    });
  });
}
