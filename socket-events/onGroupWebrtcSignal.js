import { io } from "../server.js";

const onGroupWebrtcSignal = async (data) => {
  const { sdp, ongoingGroupCall, isCaller, fromUser } = data;

  if (!ongoingGroupCall || !ongoingGroupCall.participantsGroup) {
    console.error("Missing ongoingGroupCall in signal data");
    return;
  }

  const { caller, receivers } = ongoingGroupCall.participantsGroup;

  if (isCaller) {
    // Caller is sending signals
    // Forward to all receivers except the sender
    console.error("Check isCaller");
    receivers.forEach((receiver) => {
      if (receiver.socketId && receiver.userId !== fromUser.userId) {
        io.to(receiver.socketId).emit("groupWebrtcSignal", {
          sdp,
          ongoingGroupCall,
          isCaller,
          fromUser
        });
      }
    });
  } else {
    // Not the caller, decide where to send
    if (caller.userId === fromUser.userId) {
      console.error("Check caller being fromUser");
      // Caller is sending to all receivers
      receivers.forEach((receiver) => {
        if (receiver.socketId && receiver.userId !== fromUser.userId) {
          io.to(receiver.socketId).emit("groupWebrtcSignal", {
            sdp,
            ongoingGroupCall,
            isCaller: false,
            fromUser
          });
        }
      });
    } else {
      // Receiver is sending to caller and other receivers
      // Send to caller
      console.error("Check !isCaller");
      if (caller.socketId) {
        io.to(caller.socketId).emit("groupWebrtcSignal", {
          sdp,
          ongoingGroupCall,
          isCaller: false,
          fromUser
        });
      }

      // Send to other receivers
      receivers.forEach((receiver) => {
        if (receiver.socketId && receiver.userId !== fromUser.userId) {
          io.to(receiver.socketId).emit("groupWebrtcSignal", {
            sdp,
            ongoingGroupCall,
            isCaller: false,
            fromUser
          });
        }
      });
    }
  }
};

export default onGroupWebrtcSignal;
