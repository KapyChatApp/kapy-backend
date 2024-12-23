import { LocationDTO } from "@/dtos/LocationDTO";
import { EditMapStatusDTO } from "@/dtos/MapStatusDTO";
import { locationLiveUpdate } from "@/lib/actions/location.action";
import { editStatus } from "@/lib/actions/map-status.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import IncomingForm from "formidable/Formidable";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {statusId} = req.query;
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "PATCH") {
        try {
          const form = new IncomingForm();

          form.parse(req, async (err, fields, files) => {
            if (err) {
              console.error("Form parsing error:", err);
              return res.status(500).json({ error: err.message });
            }
            const file = Array.isArray(files.file)
            ? files.file[0]
            : files.file;
            const param:EditMapStatusDTO={
                caption:fields.caption?.toString(),
                file:file,
            }
            const updatedStatus = await editStatus(req.user?.id,statusId?.toString()!, param);
            res.status(200).json(updatedStatus);
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      } else {
        res.setHeader("Allow", ["PATCH"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    });
  });
}
