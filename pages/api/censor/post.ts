import { hiddenPost } from "@/lib/actions/post.action";
import { minusPoint } from "@/lib/actions/community.action";
import fetch from "node-fetch";
import { NextApiRequest, NextApiResponse } from "next/types";
import cors from "@/middleware/cors-middleware";
import { authenticateToken, authorizeRole } from "@/middleware/auth-middleware";
import { getAllPostsToCheck } from "@/lib/actions/post.action";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(req, res, async () => {
    authenticateToken(req, res, async () => {
      authorizeRole(["admin"])(req, res, async () => {
        if (req.method === "POST") {
          try {
            const posts = await getAllPostsToCheck();

            // Chỉ giữ lại những post cần kiểm duyệt
            const postsToCheck = posts.filter((msg) => msg.flag !== false);

            // Xử lý song song bằng Promise.allSettled
            const results = await Promise.allSettled(
              postsToCheck.map(async (post) => {
                const caption = post.caption;
                const encodedText = encodeURIComponent(caption);

                const response = await fetch(
                  `https://www.purgomalum.com/service/json?text=${encodedText}`
                );
                const data = await response.json();

                const isProfane = data.result !== caption;

                if (isProfane) {
                  await hiddenPost(post._id);
                  await minusPoint(post.userId, 10);

                  return {
                    ...post,
                    isProfane: true,
                    status: "Deleted and Penalized"
                  };
                }

                return null;
              })
            );
            const checkedPosts = results
              .filter((r) => r.status === "fulfilled" && r.value !== null)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((r) => (r as PromiseFulfilledResult<any>).value);

            res.status(200).json(checkedPosts);
          } catch (error) {
            console.error("Moderation Error:", error);
            res
              .status(500)
              .json({ message: "Error in censoring post content." });
          }
        } else {
          res.setHeader("Allow", ["POST"]);
          res.status(405).end(`Method ${req.method} Not Allowed`);
        }
      });
    });
  });
}
