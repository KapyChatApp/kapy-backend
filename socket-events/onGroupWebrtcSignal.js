import { io, onlineUsers } from "../server.js";

const onGroupWebrtcSignal = (data) => {
  const { sdp, fromUserId, toUserId, ongoingGroupCall } = data;

  if (!fromUserId || !toUserId || !sdp) {
    console.warn(
      "⚠️ Missing required fields: fromUserId, toUserId, or sdp:",
      data
    );
    return;
  }

  if (fromUserId === toUserId) {
    console.warn("⚠️ Ignored SDP sent to self.");
    return;
  }

  if (typeof sdp !== "object" || (!sdp.type && !sdp.candidate)) {
    console.warn("⚠️ Invalid SDP format:", sdp);
    return;
  }

  const recipient = onlineUsers.find((user) => user.userId === toUserId);

  if (recipient?.socketId) {
    io.to(recipient.socketId).emit("groupWebrtcSignal", {
      sdp,
      fromUserId,
      ongoingGroupCall
    });

    console.log(
      `✅ [WebRTC Signal] SDP sent from ${fromUserId} to ${toUserId}`
    );
  } else {
    console.warn(
      `⚠️ [WebRTC Signal] Target socket for user ${toUserId} not found`
    );
  }
};

export default onGroupWebrtcSignal;
