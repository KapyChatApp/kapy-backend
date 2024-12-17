import jwt from "jsonwebtoken";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async (userId: string) => {
  if (!userId) throw new Error("User is not logged in");
  if (!apiKey) throw new Error("No API key");
  if (!apiSecret) throw new Error("No API secret");

  //const client = new StreamClient(apiKey, apiSecret);

  const issued = Math.floor(Date.now() / 1000) - 60; // Thời điểm phát hành

  const token = jwt.sign(
    {
      user_id: userId, // Đảm bảo `user_id` có trong payload
      issued
    },
    apiSecret,
    { expiresIn: "2h" }
  );
  return token;
};
