import { UserResponseDTO } from "@/lib/DTO/user";
import Peer from "simple-peer";

export type SocketUser = {
  userId: string;
  socketId: string;
  profile: UserResponseDTO;
};

export type Participants = {
  caller: SocketUser;
  receiver: SocketUser;
};

export type OngoingCall = {
  participants: Participants;
  isRinging: boolean;
  isVideoCall: boolean;
};

export type PeerData = {
  peerConnection: Peer.Instance;
  stream: MediaStream | undefined;
  participantUser: SocketUser;
};
