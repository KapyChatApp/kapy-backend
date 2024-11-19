import Relation from "@/database/relation.model";
import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { PublicUserDTO } from "@/dtos/UserDTO";
import { Schema } from "mongoose";
import { FriendProfileResponseDTO } from "@/dtos/FriendDTO";

export async function getFriendProfile(
  friendId: string,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();
    let friendProfileResponse: FriendProfileResponseDTO | null = null;
    const [stUserId, ndUserId] = [friendId, userId].sort();
    const relations = await Relation.find({
      stUser: stUserId,
      ndUser: ndUserId,
      status: true,
    });
    for(const relation of relations){
      if(relation.relation==="block"){
        throw new Error('User not found!');
      }
    }
    const pendingRelations = await Relation.find({
      stUser: stUserId,
      ndUser: ndUserId,
      status: false,
    });

    if (relations.length === 0 && pendingRelations.length === 0) {
      const stranger: PublicUserDTO | null = await User.findById(friendId);
      if (!stranger) {
        return false;
      }
      Object.assign(stranger, { relation: "stranger" });
      return stranger;
    }

    for (const item of relations) {
      if (item.relation === "bff") {
        const bffProfile = await User.findById(friendId);
        if (!bffProfile) {
          throw new Error("Cannot find this profile!");
        }
        const bffProfileRes: FriendProfileResponseDTO = {
          _id: bffProfile.id,
          firstName: bffProfile.firstName,
          lastName: bffProfile.lastName,
          nickName: bffProfile.nickName,
          phoneNumber: bffProfile.phoneNumber,
          email: bffProfile.email,
          avatar: bffProfile.avatar,
          background: bffProfile.background,
          gender: bffProfile.gender,
          address: bffProfile.address,
          job: bffProfile.job,
          hobbies: bffProfile.hobbies,
          bio: bffProfile.bio,
          point: bffProfile.point,
          relationShip: bffProfile.relationShip,
          birthDay: bffProfile.birthDay,
          attendDate: bffProfile.attendDate,
          relation: "bff",
        };
        return bffProfileRes;
      }
    }

    if (relations.length != 0 && pendingRelations.length == 0) {
      const friendProfile = await User.findById(friendId);
      if (!friendProfile) {
        throw new Error("Cannot find this profile!");
      }
      const friendProfileRes: FriendProfileResponseDTO = {
        _id: friendProfile.id,
        firstName: friendProfile.firstName,
        lastName: friendProfile.lastName,
        nickName: friendProfile.nickName,
        phoneNumber: friendProfile.phoneNumber,
        email: friendProfile.email,
        avatar: friendProfile.avatar,
        background: friendProfile.background,
        gender: friendProfile.gender,
        address: friendProfile.address,
        job: friendProfile.job,
        hobbies: friendProfile.hobbies,
        bio: friendProfile.bio,
        point: friendProfile.point,
        relationShip: friendProfile.relationShip,
        birthDay: friendProfile.birthDay,
        attendDate: friendProfile.attendDate,
        relation: "friend",
      };
      friendProfileResponse = friendProfileRes;
    }

    for (const item of pendingRelations) {
      let relationStatus = "";
      if (item.relation === "bff") {
        relationStatus =
          item.sender.toString() === userId?.toString()
            ? "sent_bff"
            : "received_bff";
      } else if (item.relation === "friend") {
        relationStatus =
          item.sender.toString() === userId?.toString()
            ? "sent_friend"
            : "received_friend";
      }

      if (relationStatus) {
        const friendProfile = await User.findById(friendId);
        if (!friendProfile) {
          throw new Error("Cannot find this profile!");
        }
        const friendProfileRes: FriendProfileResponseDTO = {
          _id: friendProfile.id,
          firstName: friendProfile.firstName,
          lastName: friendProfile.lastName,
          nickName: friendProfile.nickName,
          phoneNumber: friendProfile.phoneNumber,
          email: friendProfile.email,
          avatar: friendProfile.avatar,
          background: friendProfile.background,
          gender: friendProfile.gender,
          address: friendProfile.address,
          job: friendProfile.job,
          hobbies: friendProfile.hobbies,
          bio: friendProfile.bio,
          point: friendProfile.point,
          relationShip: friendProfile.relationShip,
          birthDay: friendProfile.birthDay,
          attendDate: friendProfile.attendDate,
          relation: relationStatus,
        };
        friendProfileResponse = friendProfileRes;
      }
    }

    return friendProfileResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
