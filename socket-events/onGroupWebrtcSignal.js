import { io } from "../server.js";

const onGroupWebrtcSignal = async (data) => {
  const { sdp, ongoingGroupCall, isCaller, fromUser } = data;

  const { caller, receivers } = ongoingGroupCall.participantsGroup;

  const otherCallees = [caller, ...receivers].filter(
    (user) => user.userId !== fromUser.userId
  );

  if (isCaller) {
    // Caller gửi offer cho các callee
    receivers.forEach((receiver) => {
      if (receiver.socketId) {
        io.to(receiver.socketId).emit("groupWebrtcSignal", {
          sdp,
          ongoingGroupCall,
          isCaller,
          fromUser
        });
      }
    });
  } else {
    // Callee gửi offer cho caller
    otherCallees.forEach((other) => {
      if (other.socketId) {
        io.to(other.socketId).emit("groupWebrtcSignal", {
          sdp,
          ongoingGroupCall,
          isCaller,
          fromUser
        });
      }
    });
  }
};

export default onGroupWebrtcSignal;
