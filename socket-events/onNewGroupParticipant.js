import { io } from "../server.js";

const onNewGroupParticipant = (data) => {
  const { newCallee, updatedOngoing } = data;
  console.log("New participant: ", data);
  if (!updatedOngoing || !updatedOngoing.participantsGroup) {
    console.error("Missing updatedOngoing in newGroupParticipant data");
    return;
  }

  const { currentJoiners } = updatedOngoing.participantsGroup;

  // All participants except the new one
  const existingParticipants = currentJoiners.filter(
    (user) => user.userId !== newCallee.userId
  );

  console.log(
    `Notifying ${existingParticipants.length} existing participants about new joiner`
  );

  // Notify all existing participants about the new one
  existingParticipants.forEach((participant) => {
    if (participant.socketId) {
      io.to(participant.socketId).emit("newPeerForYou", data);
    }
  });
};

export default onNewGroupParticipant;
