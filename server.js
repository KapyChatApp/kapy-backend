import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import next from "next";
import onCall from "./socket-events/onCall.js";
import onWebrtcSignal from "./socket-events/onWebrtcSignal.js";
import onHangup from "./socket-events/onHangup.js";
import onGroupCall from "./socket-events/onGroupCall.js";
import onGroupWebrtcSignal from "./socket-events/onGroupWebrtcSignal.js";
import onGroupHangup from "./socket-events/onGroupHangup.js";
import onProvideGroupCallData from "./socket-events/onProvideGroupData.js";
import onRequestGroupCallData from "./socket-events/onRequestGroupData.js";
import onNewGroupParticipant from "./socket-events/onNewGroupParticipant.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 4000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

console.log("Running...");

export let io;
export let onlineUsers = [];
export const userSocketMap = {}; // Lưu trữ userId -> socketId
export const ongoingGroupCalls = new Map(); // Server memory: groupId -> ongoingGroupCall

app.prepare().then(() => {
  const expressApp = express(); // Dùng Express để chạy API routes

  // Cấu hình CORS cho Express (cho phép tất cả các nguồn)
  expressApp.use(
    cors({
      origin: true, // Cho phép tất cả các nguồn
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "Access-Control-Allow-Headers"
      ],
      credentials: true
    })
  );

  // Tạo HTTP server
  const httpServer = createServer(expressApp);

  // Cấu hình Socket.IO với CORS (cho phép tất cả các nguồn)
  io = new Server(httpServer, {
    cors: {
      origin: true, // Cho phép tất cả các nguồn
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
      ],
      allowedHeaders: [
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Methods",
        "Authorization",

        "Content-Type",
        "Access-Control-Allow-Headers"
      ],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected...");
    console.log(`🔌 Client connected: ${socket.id}`);
    // New user event
    socket.on("addNewUsers", (clerkUser) => {
      if (clerkUser) {
        const existingUserIndex = onlineUsers.findIndex(
          (user) => user.userId === clerkUser._id
        );

        if (existingUserIndex !== -1) {
          onlineUsers[existingUserIndex].socketId = socket.id;
        } else {
          onlineUsers.push({
            userId: clerkUser._id,
            socketId: socket.id,
            profile: clerkUser
          });
        }

        console.log("Updated online users:", onlineUsers);
      }
      io.emit("getUsers", onlineUsers);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected");
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      io.emit("getUsers", onlineUsers);
    });

    // Calls
    socket.on("call", onCall);
    socket.on("webrtcSignal", onWebrtcSignal);
    socket.on("hangup", onHangup);

    // Group call events
    socket.on("groupCall", onGroupCall);
    socket.on("groupWebrtcSignal", onGroupWebrtcSignal);
    socket.on("groupHangup", onGroupHangup);
    socket.on("requestOngoingCall", onRequestGroupCallData);
    socket.on("provideOngoingGroupCall", onProvideGroupCallData);
    socket.on("newGroupParticipant", onNewGroupParticipant);
  });

  // Next.js API routes và Pages sẽ chạy sau khi cấu hình Express
  expressApp.all("*", (req, res) => handler(req, res)); // Chạy API routes của Next.js

  // Khởi động server HTTP với Express
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
