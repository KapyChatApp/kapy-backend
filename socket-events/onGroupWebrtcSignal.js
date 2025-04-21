import { io } from "../server.js";

const onGroupWebrtcSignal = async (data) => {
  // data : {
  //   sdp: SignalData;
  //   ongoingGroupCall: OngoingGroupCall;
  //   isCaller: boolean;
  // }
  if (data.isCaller) {
    const receivers = data.ongoingGroupCall?.participantsGroup?.receivers || [];

    receivers.forEach((receiver) => {
      if (receiver?.socketId) {
        io.to(receiver.socketId).emit("groupWebrtcSignal", data);
      }
    });
  } else {
    const callerSocketId =
      data.ongoingGroupCall?.participantsGroup?.caller?.socketId;
    if (callerSocketId) {
      io.to(callerSocketId).emit("groupWebrtcSignal", data);
    }
  }
};

export default onGroupWebrtcSignal;
