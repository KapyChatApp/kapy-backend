import { io, onlineUsers } from "../server.js";

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

const onRequestGroupCallData = (data) => {
  const { groupInfo, fromUser } = data;
  const { members } = groupInfo;

  const memberIds = members.map((m) => m._id);

  const onlineGroupMembers = onlineUsers.filter(
    (user) => memberIds.includes(user.userId) && user.userId !== fromUser.userId
  );

  console.log(
    `📨 Requesting group call data from ${onlineGroupMembers.length} users`
  );

  onlineGroupMembers.forEach((user) => {
    io.to(user.socketId).emit("needOngoingGroupCall", {
      groupId: groupInfo._id,
      fromUser: fromUser
    });
  });
};

export default onRequestGroupCallData;
