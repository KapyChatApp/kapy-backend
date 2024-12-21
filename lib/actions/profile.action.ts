import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { Schema } from "mongoose";
import { FriendProfileResponseDTO } from "@/dtos/FriendDTO";
import { getMutualFriends } from "./friend.action";
import { getRelationFromTo } from "./relation.action";

export async function getFriendProfile(
  friendId: string,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();
    const mutualFriends = await getMutualFriends(userId?.toString(), friendId);

    const  friend = await User.findById(friendId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const relation = await getRelationFromTo(userId?.toString()!,friendId);
    if(relation==="block") {throw new Error('User not found')}
    const friendProfileResponse:FriendProfileResponseDTO={
      _id: friend.id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      nickName: friend.nickName,
      phoneNumber: friend.phoneNumber,
      email: friend.email,
      avatar: friend.avatar,
      background: friend.background,
      gender: friend.gender,
      address: friend.address,
      job: friend.job,
      hobbies: friend.hobbies,
      bio: friend.bio,
      point: friend.point,
      relationShip: friend.relationShip,
      birthDay: friend.birthDay,
      attendDate: friend.attendDate,
      relation: relation,
      mutualFriends: mutualFriends!,
    }

    return friendProfileResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
