import { io, ongoingGroupCalls } from "../server.js";

const onGroupHangup = async (data) => {
  const { userHangingupId, ongoingGroupCall, isEmitHangup } = data;
  const { caller, receivers, groupDetails } =
    ongoingGroupCall.participantsGroup;

  if (!caller || !receivers) return;

  const totalParticipants = [...receivers, caller].length;
  const isCaller = caller.userId === userHangingupId;

  if (isEmitHangup || isCaller || totalParticipants <= 2) {
    // 👉 TH thật sự là hangup: caller kết thúc hoặc chỉ còn 1 người
    console.log("🛑 Cuộc gọi kết thúc hoàn toàn");

    const allParticipants = [...receivers, caller];
    allParticipants.forEach((participant) => {
      if (participant.socketId) {
        io.to(participant.socketId).emit("groupHangup"); // gửi sự kiện kết thúc
      }
    });
    ongoingGroupCalls.delete(groupDetails._id);
  } else {
    // 👉 TH này là rời khỏi cuộc gọi
    const updatedReceivers = receivers.filter(
      (r) => r.userId !== userHangingupId
    );
    const leaver = receivers.find((r) => r.userId === userHangingupId);
    const otherParticipants = [...updatedReceivers, caller];

    console.log(`👤 User ${userHangingupId} đã rời khỏi cuộc gọi`);

    otherParticipants.forEach((participant) => {
      if (participant.socketId && leaver) {
        io.to(participant.socketId).emit("leavingRoom", {
          leaverUserId: userHangingupId,
          participantsGroup: {
            caller,
            receivers: updatedReceivers,
            groupDetails
          }
        });
      }
    });
  }
};

export default onGroupHangup;
