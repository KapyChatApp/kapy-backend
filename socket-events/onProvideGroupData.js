import { io } from "../server.js";

const onProvideGroupCallData = (data) => {
  const { toSocketId, ongoingGroupCall } = data;

  // 1. Gửi ongoingGroupCall để người mới join
  io.to(toSocketId).emit("receiveGroupCallData", ongoingGroupCall);

  // 2. Đồng thời yêu cầu các thành viên còn lại tạo peer tới người mới
  const newUserId = ongoingGroupCall.participantsGroup.receivers.find(
    (r) => r.socketId === toSocketId
  )?.userId;

  if (!newUserId) return;

  const allPeers = [
    ongoingGroupCall.participantsGroup.caller,
    ...ongoingGroupCall.participantsGroup.receivers
  ];

  allPeers.forEach((peerUser) => {
    if (peerUser.socketId && peerUser.userId !== newUserId) {
      io.to(peerUser.socketId).emit("groupWebrtcSignal", {
        sdp: null, // bắt đầu kết nối mới
        ongoingGroupCall,
        isCaller: true
      });
    }
  });

  // Gửi ngược lại cho người mới luôn (để nhận signal)
  io.to(toSocketId).emit("groupWebrtcSignal", {
    sdp: null,
    ongoingGroupCall,
    isCaller: false
  });
};

export default onProvideGroupCallData;
