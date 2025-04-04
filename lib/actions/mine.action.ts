import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import {
  FriendManageResponseDTO,
  FriendResponseDTO,
  RequestedResponseDTO
} from "@/dtos/FriendDTO";
import Relation from "@/database/relation.model";
import { Schema } from "mongoose";
import { getMutualFriends } from "./friend.action";
import { getRelationFromTo } from "./relation.action";

export async function getMyFriends(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const friendIds = user.friendIds;
    if (friendIds.length == 0) {
      console.log("You dont have any friend");
    }
    const friends = await User.find({
      _id: { $in: friendIds }
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
        mutualFriends: mutualFriends!
      };
      friendResponses.push(friendResponse);
    }
    return friendResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getManageFriends(
  myId: Schema.Types.ObjectId | undefined
) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const friendIds = user.friendIds;
    if (friendIds.length == 0) {
      console.log("You dont have any friend");
    }
    const friends = await User.find({
      _id: { $in: friendIds }
    }).exec();
    const friendResponses: FriendResponseDTO[] = [];
    for (const friend of friends) {
      const mutualFriends = await getMutualFriends(
        myId?.toString(),
        friend._id
      );
      const myRelations = await Relation.find({
        $or: [{ sender: myId }, { receiver: friend._id }],
        status: true
      });

      const friendResponse: FriendManageResponseDTO = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        nickName: friend.nickName,
        avatar: friend.avatar,
        mutualFriends: mutualFriends!,
        createAt: myRelations[0].createAt,
        relation: myRelations[0].relation
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
      _id: { $in: bestFriendIds }
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
        mutualFriends: mutualFriends!
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
      _id: { $in: blockedIds }
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
        mutualFriends: mutualFriends!
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
    const myPendingRelations = await Relation.find({
      $or: [{ sender: myId }, { receiver: myId }],
      status: false
    });
    const myRequestResponses: RequestedResponseDTO[] = [];
    for (const relation of myPendingRelations) {
      const otherUserId =
        relation.sender.toString() === myId?.toString()
          ? relation.receiver
          : relation.sender;
      const user = await User.findById(otherUserId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const relationOfUs = await getRelationFromTo(
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        myId?.toString()!,
        otherUserId.toString()
      );
      const requestUser: RequestedResponseDTO = {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        relation: relationOfUs,
        createAt: user.createAt
      };
      myRequestResponses.push(requestUser);
    }
    return myRequestResponses;
    // const myPendingBFFs = await Relation.find({
    //   receiver: myId,
    //   status: false,
    //   relation: "bff",
    // });
    // const bffSenders = myPendingBFFs.map((item) => item.sender);
    // const myPendingFriends = await Relation.find({
    //   $or:[
    //     {receiver:myId},
    //    {receiver: myId},
    //   ],
    //   status: false,
    //   relation: "friend",
    //   sender: { $nin: bffSenders },
    // });
    // const friendSenders = myPendingFriends.map((item) => item.sender);
    // const bffSenderUsers = await User.find({ _id: { $in: bffSenders } });
    // const friendSenderUsers = await User.find({ _id: { $in: friendSenders } });
    // const bffRequesteds: RequestedResponseDTO[] = [];
    // const friendRequesteds: RequestedResponseDTO[] = [];
    // bffSenderUsers.map((item) => {
    //   bffRequesteds.push({
    //     _id: item.id,
    //     firstName: item.firstName,
    //     lastName: item.lastName,
    //     avatar: item.avatar,
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    //     relation: "bff",
    //     createAt: item.createAt,
    //   });
    // });
    // friendSenderUsers.map( (item) => {
    //   friendRequesteds.push({
    //     _id: item.id,
    //     firstName: item.firstName,
    //     lastName: item.lastName,
    //     avatar: item.avatar,
    //     // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    //     relation: "friend",
    //     createAt: item.createAt,
    //   });
    // });
    // return bffRequesteds.concat(friendRequesteds);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
