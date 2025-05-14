import { io } from "../server.js";

const onCall = async (participants, isVideoCall) => {
  // participants: Participants
  console.log("participats>>>>",participants);
  if (participants.receiver.socketId) {
    console.log("Receiver socketId on server:", participants.receiver.socketId);
    io.to(participants.receiver.socketId).emit(
      "incomingCall",
      participants,
      isVideoCall
    );
  }
};

export default onCall;
