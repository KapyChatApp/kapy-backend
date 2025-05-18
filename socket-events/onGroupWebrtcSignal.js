import { io, onlineUsers } from "../server.js";

const onGroupWebrtcSignal = (data) => {
  const { sdp, fromUserId, toUserId, ongoingGroupCall } = data;

  if (!fromUserId || !toUserId || !sdp) {
    console.warn("⚠️ Thiếu dữ liệu cần thiết trong WebRTC signal");
    return;
  }

  const target = onlineUsers.find((user) => user.userId === toUserId);
  if (target?.socketId) {
    io.to(target.socketId).emit("groupWebrtcSignal", {
      sdp,
      fromUserId,
      ongoingGroupCall
    });
    console.log(`✅ [WebRTC] Sending SDP from ${fromUserId} to ${toUserId}`);
  } else {
    console.warn(`⚠️ [WebRTC] No find socket of user ${toUserId}`);
  }
};

export default onGroupWebrtcSignal;
