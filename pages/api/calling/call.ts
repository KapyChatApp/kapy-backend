import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { StreamChat } from 'stream-chat';

const SECRET_KEY = "your-stream-chat-secret-key";  // Secret Key của bạn (tốt nhất nên để trong .env)

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;  // Lấy userId từ query string

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: "Missing or invalid userId" });
        }

        const serverClient = new StreamChat(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
        console.log(serverClient)
        const token = serverClient.createToken(userId);
            res.status(200).json({ token });  // Trả token về client
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });  // Nếu không phải là phương thức GET
    }
}
