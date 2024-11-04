import { NextApiRequest, NextApiResponse } from "next";
export default function cors(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  // Nếu là một yêu cầu OPTIONS, trả về ngay
  console.log("Received Request Method:", req.method);
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type"
    );
    return res.status(200).end();
  }

  next(); // Gọi tiếp middleware hoặc handler tiếp theo
}
