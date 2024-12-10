import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { FriendResponseDTO, RequestedResponseDTO } from "@/dtos/FriendDTO";
import Relation from "@/database/relation.model";
import { Schema } from "mongoose";
import { getMutualFriends } from "./friend.action";

export async function getMyFriends(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const friendIds = user.friendIds;
    if (friendIds.length == 0) {
      console.log("You dont have any friend");
    }
    const friends = await User.find({
      _id: { $in: friendIds },
    }).exec();
    const friendResponses: FriendResponseDTO[] = [];
    for (const friend of friends) {
      const mutualFriends = await getMutualFriends(
        myId?.toString(),
        friend._id
      );
      const friendResponse: FriendResponseDTO = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        nickName: friend.nickName,
        avatar: friend.avatar,
        mutualFriends: mutualFriends,
      };
      friendResponses.push(friendResponse);
    }
    return friendResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyBFFs(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const bestFriendIds = user.bestFriendIds;
    if (bestFriendIds.length == 0) {
      console.log("You dont have any bestfriend");
    }
    const bestfriends = await User.find({
      _id: { $in: bestFriendIds },
    }).exec();
    const bffResponses: FriendResponseDTO[] = [];
    for (const friend of bestfriends) {
      const mutualFriends = await getMutualFriends(
        myId?.toString(),
        friend._id
      );
      const bffResponse: FriendResponseDTO = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        nickName: friend.nickName,
        avatar: friend.avatar,
        mutualFriends: mutualFriends,
      };
      bffResponses.push(bffResponse);
    }
    return bffResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyBlocks(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const blockedIds = user.blockedIds;
    if (blockedIds.length == 0) {
      console.log("You dont have any block");
    }
    const blocks = await User.find({
      _id: { $in: blockedIds },
    }).exec();
    const blocksResponses: FriendResponseDTO[] = [];
    for (const friend of blocks) {
      const mutualFriends = await getMutualFriends(
        myId?.toString(),
        friend._id
      );
      const blocksResponse: FriendResponseDTO = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        nickName: friend.nickName,
        avatar: friend.avatar,
        mutualFriends: mutualFriends,
      };
      blocksResponses.push(blocksResponse);
    }
    return blocksResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyRequested(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const myPendingBFFs = await Relation.find({
      receiver: myId,
      status: false,
      relation: "bff",
    });
    const bffSenders = myPendingBFFs.map((item) => item.sender);
    const myPendingFriends = await Relation.find({
      receiver: myId,
      status: false,
      relation: "friend",
      sender: { $nin: bffSenders },
    });
    const friendSenders = myPendingFriends.map((item) => item.sender);
    const bffSenderUsers = await User.find({ _id: { $in: bffSenders } });
    const friendSenderUsers = await User.find({ _id: { $in: friendSenders } });
    const bffRequesteds: RequestedResponseDTO[] = [];
    const friendRequesteds: RequestedResponseDTO[] = [];
    bffSenderUsers.map((item) => {
      bffRequesteds.push({
        _id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        avatar: item.avatar,
        relation: "bff",
        createAt: item.createAt,
      });
    });
    friendSenderUsers.map((item) => {
      friendRequesteds.push({
        _id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        avatar: item.avatar,
        relation: "friend",
        createAt: item.createAt,
      });
    });
    return bffRequesteds.concat(friendRequesteds);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
