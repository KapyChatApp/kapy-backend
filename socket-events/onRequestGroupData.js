import { io } from "../server.js";

// data: {
//   groupInfo: {
//     _id: string;
//     name: string;
//     avatar: string;
//     members: UserInfoBox[]; // UserInfoBox: { _id, name, ... }
//   },
//   userId: string, // người đang yêu cầu
//   socketId: string // socket hiện tại
// }

const onRequestGroupCallData = (onlineUsers) => (data) => {
  const { groupInfo, userId, socketId } = data;

  const memberIds = groupInfo.members.map((m) => m._id);

  const onlineGroupMembers = onlineUsers.filter(
    (user) => memberIds.includes(user.userId) && user.userId !== userId
  );

  console.log(
    `📨 Requesting group call data from ${onlineGroupMembers.length} users`
  );

  onlineGroupMembers.forEach((user) => {
    io.to(user.socketId).emit("needGroupCallData", {
      groupId: groupInfo._id,
      toSocketId: socketId
    });
  });
};

export default onRequestGroupCallData;
