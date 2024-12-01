import { pusherServer } from "@/lib/pusher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function handler(req: any, res: any) {
  if (req.method === "POST") {
    const { socket_id, channel_name } = req.body;

    try {
      const auth = pusherServer.authorizeChannel(socket_id, channel_name);
      res.status(200).send(auth);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (error: any) {
      res.status(500).send({ error: "Authentication failed" });
    }
  } else {
    res.status(405).send({ error: "Method not allowed" });
  }
}
