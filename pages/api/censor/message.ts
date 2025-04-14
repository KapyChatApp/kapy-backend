import {
  getAllMessageToCheck,
  hiddenMessage
} from "@/lib/actions/message.action";
import { minusPoint } from "@/lib/actions/community.action";
import fetch from "node-fetch";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "POST") {
          try {
            const messages = await getAllMessageToCheck();

            // Chỉ giữ lại những message cần kiểm duyệt
            const messagesToCheck = messages.filter(
              (msg) => msg.flag !== false
            );

            // Xử lý song song bằng Promise.allSettled
            const results = await Promise.allSettled(
              messagesToCheck.map(async (message) => {
                const lastText = message.text[message.text.length - 1];
                const encodedText = encodeURIComponent(lastText);

                const response = await fetch(
                  `https://www.purgomalum.com/service/json?text=${encodedText}`
                );
                const data = await response.json();

                const isProfane = data.result !== lastText;

                if (isProfane) {
                  await hiddenMessage(message._id);
                  await minusPoint(message.createBy._id, 10);

                  return {
                    ...message,
                    isProfane: true,
                    status: "Deleted and Penalized"
                  };
                }

                return null;
              })
            );
            const checkedMessages = results
              .filter((r) => r.status === "fulfilled" && r.value !== null)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((r) => (r as PromiseFulfilledResult<any>).value);

            res.status(200).json(checkedMessages);
          } catch (error) {
            console.error("Moderation Error:", error);
            res
              .status(500)
              .json({ message: "Error in censoring message content." });
          }
        } else {
          res.setHeader("Allow", ["POST"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    });
  });
}
