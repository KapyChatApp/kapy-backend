import { ShortUserResponseDTO, UserResponseDTO } from "@/lib/DTO/user";
import Peer from "simple-peer";
import { SocketUser } from "./socket";
import { UserInfoBox } from "@/lib/DTO/message";

export type SocketGroup = {
  _id: string;
  name: string;
  avatar: string;
  members: UserInfoBox[];
};

export type ParticipantsGroup = {
  groupDetails: SocketGroup;
  receivers: SocketUser[];
  caller: SocketUser;
};

export type OngoingGroupCall = {
  participantsGroup: ParticipantsGroup;
  isRinging: boolean;
};

export type PeerDataGroup = {
  peerConnection: Peer.Instance;
  stream: MediaStream | undefined;
  participantUser: SocketUser[];
};
