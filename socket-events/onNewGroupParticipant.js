import { io } from "../server.js";

const onNewGroupParticipant = (data) => {
  const { newCallee, updatedOngoing } = data;

  if (!updatedOngoing || !updatedOngoing.participantsGroup) {
    console.error("Missing updatedOngoing in newGroupParticipant data");
    return;
  }

  const { receivers } = updatedOngoing.participantsGroup;

  // All participants except the new one
  const existingParticipants = receivers.filter(
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
