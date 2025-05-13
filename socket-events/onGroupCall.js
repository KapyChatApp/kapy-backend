import { io, ongoingGroupCalls } from "../server.js";

const onGroupCall = async (participantsGroup) => {
  ongoingGroupCalls.set(participantsGroup.groupDetails._id, {
    participantsGroup,
    isRinging: false
  });

  // participantsGroup: ParticipantsGroup
  console.log(
    `📞 Group call initiated by host: ${participantsGroup.caller.userId}, groupId: ${participantsGroup.groupDetails._id}, groupName: ${participantsGroup.groupDetails.name}`
  );
  participantsGroup.receivers.forEach((member) => {
    console.log("🔔 Sending group call to:", member.userId, member.socketId);
    io.to(member.socketId).emit("incomingGroupCall", participantsGroup);
  });
};

export default onGroupCall;
