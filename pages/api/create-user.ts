import { CreateUserDTO } from "@/dtos/UserDTO";
import { createUser } from "@/lib/actions/authentication.action";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      // Lấy dữ liệu từ body
      const params: CreateUserDTO = req.body;

      // Gọi hàm tạo người dùng
      const newUser = await createUser(params);

      // Trả về thông tin người dùng mới tạo
      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);

      // Trả về lỗi nếu có
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "An unexpected error occurred." });
    }
  } else {
    // Phương thức không được hỗ trợ
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
