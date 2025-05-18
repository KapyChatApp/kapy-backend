import { io, ongoingGroupCalls } from "../server.js";

const onGroupHangup = async (data) => {
  const { userHangingupId, ongoingGroupCall, isEmitHangup } = data;
  const { caller, callees, currentJoiners, groupDetails } =
    ongoingGroupCall.participantsGroup;

  if (!caller || !callees || !currentJoiners) return;

  const totalParticipants = currentJoiners.length;
  const isCaller = caller.userId === userHangingupId;

  if (isEmitHangup || isCaller || totalParticipants <= 2) {
    // 👉 TH thật sự là hangup: caller kết thúc hoặc chỉ còn 1 người
    console.log("🛑 Cuộc gọi kết thúc hoàn toàn");

    currentJoiners.forEach((participant) => {
      if (participant.socketId) {
        io.to(participant.socketId).emit("groupHangup");
      }
    });
    ongoingGroupCalls.delete(groupDetails._id);
  } else {
    // 👉 TH này là rời khỏi cuộc gọi
    const updatedJoiners = currentJoiners.filter(
      (r) => r.userId !== userHangingupId
    );
    const updatedCallees = callees.filter((r) => r.userId !== userHangingupId);
    const leaver = callees.find((c) => c.userId === userHangingupId);

    console.log(`👤 User ${userHangingupId} đã rời khỏi cuộc gọi`);

    updatedJoiners.forEach((participant) => {
      if (participant.socketId && leaver) {
        io.to(participant.socketId).emit("leavingRoom", {
          leaverUserId: userHangingupId,
          participantsGroup: {
            caller,
            currentJoiners: updatedJoiners,
            callees: updatedCallees,
            groupDetails
          }
        });
      }
    });
  }
};

export default onGroupHangup;
