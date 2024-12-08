import { RequestSendMessageDTO } from "@/dtos/MessageDTO";
import {createMessageMobile } from "@/lib/actions/message.action";
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
        console.log("Fields:", fields); 
        console.log("Files:", files);

        try {

          if (req.user && req.user.id) {
            const userId = req.user.id.toString();
            if (userId) {
              const data: RequestSendMessageDTO = {
                boxId: Array.isArray(fields.boxId) ? fields.boxId[0] : "",
                content: fields.content?.toString() || ""
              }
              console.log("data:", data);
              if(files.file){
              const filesToUpload = Array.isArray(files.file)
              ? files.file
              : [files.file];
                const result = await createMessageMobile(data, userId, filesToUpload);
                return res.status(200).json(result);} else{
                    
                }
            }
          } else {
            return res.status(400).json({ message: "userId is required" });
          }
        } catch (error) {
            console.log(error);
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
