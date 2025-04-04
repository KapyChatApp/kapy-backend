import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import next from "next";
import onCall from "./socket-events/onCall.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

console.log("Running...");

export let io;
export const userSocketMap = {}; // Lưu trữ userId -> socketId

app.prepare().then(() => {
  const expressApp = express(); // Dùng Express để chạy API routes

  // Cấu hình CORS cho Express
  expressApp.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin.startsWith("http://localhost:3001")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true
    })
  );

  // Tạo HTTP server
  const httpServer = createServer(expressApp);

  // Cấu hình Socket.IO với CORS
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.startsWith("http://localhost:3001")) {
          callback(null, true);
        } else {
          console.error("CORS error: Not allowed by CORS");
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true
    }
  });

  let onlineUsers = [];

  io.on("connection", (socket) => {
    console.log("Client connected...");

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
  });

  // Next.js API routes và Pages sẽ chạy sau khi cấu hình Express
  expressApp.all("*", (req, res) => handler(req, res)); // Chạy API routes của Next.js

  // Khởi động server HTTP với Express
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
