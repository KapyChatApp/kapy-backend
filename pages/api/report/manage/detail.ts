import { getDetailReport } from "@/lib/actions/report.action";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "GET") {
          try {
            const { reportId } = req.query;
            if (!reportId) {
              return res.status(400).json({ report: "Report Id is required" });
            }

            const result = await getDetailReport(reportId.toString());

            if (result) {
              res.status(200).json(result);
            } else {
              return res.status(404).json({
                success: false,
                report: "report not found or can be removed"
              });
            }
          } catch (error) {
            console.error("Error get detail reports: ", error);
            const errorreport =
              error instanceof Error ? error.message : "Unknown error occurred";
            res
              .status(500)
              .json({ report: "Internal Server Error", error: errorreport });
          }
        } else {
          res.setHeader("Allow", ["GET"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    });
  });
}
