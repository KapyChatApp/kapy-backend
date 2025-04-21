import { io } from "../server.js";

const onHangup = async (data) => {
  // data: {
  //   ongoingCall: OngoingCall,
  //   userHangingupId: string
  // }

  let socketIdEmitTo;

  if (data?.ongoingCall.participants.caller.userId === data.userHangingupId)
    socketIdEmitTo = data.ongoingCall.participants.receiver.socketId;
  else socketIdEmitTo = data.ongoingCall.participants.caller.socketId;

  if (socketIdEmitTo) {
    io.to(socketIdEmitTo).emit("hangup");
  }
};

export default onHangup;
