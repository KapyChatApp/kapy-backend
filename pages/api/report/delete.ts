import { deleteReport } from "@/lib/actions/report.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default async function hanlder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      if (req.method === "DELETE") {
        try {
          const reportId = Array.isArray(req.query.reportId)
            ? req.query.reportId[0]
            : req.query.reportId;
          if (!reportId) {
            return res
              .status(400)
              .json({ message: "Missing or invalid reportId." });
          }
          if (!req.user?.id) {
            return res.status(403).json({ message: "You are unauthenticated" });
          }
          const result = await deleteReport(reportId, req.user?.id);
          return res.status(200).json(result);
        } catch (error) {
          console.error(error);

          if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
          }
          return res
            .status(500)
            .json({ message: "An unexpected error occurred." });
        }
      } else {
        return res.status(405).json({ message: "Method Not Allowed" });
      }
    });
  });
}
