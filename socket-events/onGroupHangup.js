import { io } from "../server.js";

const onGroupHangup = async (data) => {
  const { userHangingupId, ongoingGroupCall } = data;
  const { caller, receivers } = ongoingGroupCall.participantsGroup;

  if (!caller || !receivers) return;

  const totalParticipants = receivers.length;

  const isCaller = caller.userId === userHangingupId;

  // Nếu là caller hoặc chỉ còn 2 người thì kết thúc toàn bộ cuộc gọi
  if (isCaller || totalParticipants <= 1) {
    // Gửi tới tất cả các receiver
    console.log("Gửi groupHangup cho tất cả các receiver");
    receivers.forEach((receiver) => {
      if (receiver.socketId) {
        io.to(receiver.socketId).emit("groupHangup");
      }
    });

    // Gửi lại caller (còn mỗi caller trong phòng)
    if (!isCaller && caller.socketId) {
      console.log("Gửi groupHangup cho caller");
      io.to(caller.socketId).emit("groupHangup");
    }
  } else {
    // Một receiver rời đi, cuộc gọi vẫn tiếp tục
    // Gửi sự kiện groupPeerLeave để những người còn lại xoá peer này
    console.log("Gửi groupPeerLeave cho những người còn lại");
    const leaver = receivers.find((r) => r.userId === userHangingupId);

    const otherParticipants = [
      caller,
      ...receivers.filter((r) => r.userId !== userHangingupId)
    ];

    otherParticipants.forEach((participant) => {
      if (participant.socketId && leaver) {
        io.to(participant.socketId).emit("groupPeerLeave", {
          leaverUserId: userHangingupId
        });
      }
    });
  }
};

export default onGroupHangup;
