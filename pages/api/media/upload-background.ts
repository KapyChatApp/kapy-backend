import type { NextApiRequest, NextApiResponse } from "next";
import { uploadBackground } from "@/lib/actions/media.action";
import { authenticateToken } from "@/middleware/auth-middleware";
import cloudinary from "@/cloudinary";
import { IncomingForm } from "formidable";
import cors from "@/middleware/cors-middleware";
import { findUserById } from "@/lib/actions/user.action";
import { addPost } from "@/lib/actions/post.action";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      const isCreatePost = req.query;
      if (req.method === "POST") {
        const form = new IncomingForm();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            return res.status(500).json({ error: err.message });
          }

          if (files.file) {
            try {
              const file = Array.isArray(files.file)
                ? files.file[0]
                : files.file;
              const result = await cloudinary.uploader.upload(file.filepath, {
                folder: "Avatar",
              });

              await uploadBackground(
                req.user?.id,
                result.secure_url,
                result.public_id
              );
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              const user = await findUserById(req.user?.id?.toString()!);
              if (isCreatePost) {
                await addPost(
                  [file],
                  [
                    `${
                      user.firstName + " " + user.lastName
                    } Update a new background`,
                  ],
                  req.user?.id,
                  [],
                  "",
                  "",
                  "",
                  ""
                );
              }
              return res
                .status(200)
                .json({ status: true, message: "Update successfully!" });
            } catch (error) {
              console.error("Cloudinary upload error:", error);
              return res.status(500).json({ error: "Failed to upload image" });
            }
          } else {
            return res.status(400).json({ error: "No file uploaded" });
          }
        });
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
};

export default handler;
