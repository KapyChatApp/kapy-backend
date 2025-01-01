import { initiateSystem } from "@/lib/actions/system.action";
import cors from "@/middleware/cors-middleware";
import { NextApiRequest, NextApiResponse } from "next/types";
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    cors(req, res, async () => {
        if (req.method === "GET") {
            try {
                const initiateData = await initiateSystem();
                return res.status(200).json(initiateData);
            } catch (error) {
                console.error(error);
                res.status(404).json({ message: "Internal Server Error" });
            }
        } else {
            res.setHeader("Allow", ["GET"]);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }

    });
}
