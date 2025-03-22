import { authenticateToken } from "@/middleware/auth-middleware";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { addPost } from "@/lib/actions/post.action";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, () => {
    authenticateToken(req, res, async () => {
      if (req.method === "POST") {
        if (!req.user?.id) {
          return res.status(401).json({ error: "You are unauthenticated!" });
        }

        const form = new IncomingForm();

        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            return res.status(500).json({ error: err.message });
          }

          // Parse tagIds properly
          let parsedTagIds: string[] = [];
          
          if (fields.tagIds) {
            if (Array.isArray(fields.tagIds)) {
              // Handle case where it's already an array
              parsedTagIds = fields.tagIds.flatMap(item => {
                try {
                  // Try to parse each item if it's a JSON string
                  const parsed = JSON.parse(item);
                  return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                  // If not valid JSON, use as is
                  console.log("err parsing tagIds: ",e);
                  return [item];
                }
              });
            } else if (typeof fields.tagIds === "string") {
              try {
                // Try to parse as JSON
                const parsed = JSON.parse(fields.tagIds);
                parsedTagIds = Array.isArray(parsed) ? parsed : [parsed];
              } catch (e) {
                // Not valid JSON, use as single item
                console.log("err parsing tagIds: ",e);
                parsedTagIds = [fields.tagIds];
              }
            }
          }
          
          console.log("parsedTagIds: ", parsedTagIds);

          try {
            if (files.file) {
              const filesToUpload = Array.isArray(files.file)
                ? files.file
                : [files.file];
                
              const createdPost = await addPost(
                filesToUpload,
                fields.caption,
                req.user?.id,
                parsedTagIds,
                fields.musicName ? fields.musicName.toString() : "",
                fields.musicURL ? fields.musicURL.toString() : "",
                fields.musicAuthor ? fields.musicAuthor.toString() : "",
                fields.musicImageURL ? fields.musicImageURL.toString() : ""
              );

              return res.status(200).json(createdPost);
            } else {
              const createdPost = await addPost(
                [],
                fields.caption,
                req.user?.id,
                parsedTagIds,
                fields.musicName ? fields.musicName.toString() : "",
                fields.musicURL ? fields.musicURL.toString() : "",
                fields.musicAuthor ? fields.musicAuthor.toString() : "",
                fields.musicImageURL ? fields.musicImageURL.toString() : ""
              );

              return res.status(200).json(createdPost);
            }
          } catch (error) {
            console.error("Error creating post:", error);
            return res.status(500).json({ error: "Failed to create post" });
          }
        });
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
    });
  });
}