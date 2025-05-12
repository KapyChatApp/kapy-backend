import { io } from "../server.js";

const onRejoinGroupCall = async (data) => {
  const { ongoingGroupCall, userId, socketId } = data;

  console.log(
    `🔄 User ${userId} is rejoining group call with socketId: ${socketId}`
  );

  // Cập nhật lại socketId cho user trong participantsGroup
  const updatedReceivers = ongoingGroupCall.participantsGroup.receivers.map(
    (receiver) => {
      if (receiver.userId === userId) {
        return { ...receiver, socketId };
      }
      return receiver;
    }
  );

  const updatedOngoingGroupCall = {
    ...ongoingGroupCall,
    participantsGroup: {
      ...ongoingGroupCall.participantsGroup,
      receivers: updatedReceivers
    }
  };

  // Gửi signal cho các thành viên khác
  updatedReceivers.forEach((receiver) => {
    if (receiver.socketId && receiver.userId !== userId) {
      io.to(receiver.socketId).emit("groupWebrtcSignal", {
        sdp: null, // yêu cầu peer còn lại tạo kết nối mới
        ongoingGroupCall: updatedOngoingGroupCall,
        isCaller: true
      });
    }
  });

  // Đồng thời gửi tín hiệu ngược về người rejoin
  const callerSocketId =
    updatedOngoingGroupCall.participantsGroup.caller.socketId;
  if (
    callerSocketId &&
    userId !== updatedOngoingGroupCall.participantsGroup.caller.userId
  ) {
    io.to(socketId).emit("groupWebrtcSignal", {
      sdp: null,
      ongoingGroupCall: updatedOngoingGroupCall,
      isCaller: false
    });
  }
};

export default onRejoinGroupCall;
