import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import { CreateMapStatusDTO } from "@/dtos/MapStatusDTO";
import { createStatus } from "@/lib/actions/map-status.action";
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
      if (req.method === "POST") {
        const form = new IncomingForm();
        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            return res.status(500).json({ error: err.message });
          }
        
          if (files.file) {
            try {
              const file = Array.isArray(files.file) ? files.file[0] : files.file;
              const caption = fields.caption;
              const param: CreateMapStatusDTO = {
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                caption: caption?.toString()!,
                file: file,
              };
              const result = await createStatus(req.user?.id, param);
              return res.status(200).json(result);
            } catch (error) {
              console.error("Error uploading file:", error);
              return res.status(500).json({ error: "Failed to upload image" });
            }
          } else {
            try {
              const caption = fields.caption;
              const param: CreateMapStatusDTO = {
                // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                caption: caption?.toString()!,
              };
              const result = await createStatus(req.user?.id, param);
              return res.status(200).json(result);
            } catch (error) {
              console.error("Error processing caption:", error);
              return res.status(500).json({ error: "Failed to process caption" });
            }
          }
        });
        
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}
