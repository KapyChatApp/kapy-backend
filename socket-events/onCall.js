import { io } from "../server.js";

const onCall = async (participants) => {
  if (participants.receiver.socketId) {
    console.log("Receiver socketId on server:", participants.receiver.socketId);
    io.to(participants.receiver.socketId).emit("incomingCall", participants);
  }
};

export default onCall;
