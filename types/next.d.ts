// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextApiRequest } from "next";

declare module "next" {
  interface NextApiRequest {
    file?: Express.Multer.File; // Thêm thuộc tính file
  }
}
