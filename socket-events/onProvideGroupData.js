import { io } from "../server.js";

const onProvideGroupCallData = (data) => {
  const { calleeRequest, ongoingGroupCall } = data;
  console.log("Provide data: ", ongoingGroupCall);
  io.to(calleeRequest.socketId).emit(
    "receiveOngoingGroupCall",
    ongoingGroupCall
  );
};

export default onProvideGroupCallData;
