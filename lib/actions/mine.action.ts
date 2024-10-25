import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { FriendResponseDTO } from "@/dtos/FriendDTO";
import Relation from "@/database/relation.model";
import { Schema } from "mongoose";

export async function getMyFriends(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const user = await User.findById(myId);
    const friendIds = user.friendIds;
    if (friendIds.length == 0) {
      console.log("You dont have any friend");
    }
    const friends: FriendResponseDTO[] = await User.find({
      _id: { $in: friendIds },
    }).exec();

    return friends;
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
    const bestfriends: FriendResponseDTO[] = await User.find({
      _id: { $in: bestFriendIds },
    }).exec();

    return bestfriends;
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
    const blocks: FriendResponseDTO[] = await User.find({
      _id: { $in: blockedIds },
    }).exec();

    return blocks;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getMyRequested(myId: Schema.Types.ObjectId | undefined) {
  try {
    connectToDatabase();
    const myRequested: FriendResponseDTO[] = await Relation.find({
      receiver: myId,
      status: false,
    });
    if (myRequested.length == 0) {
      return { message: "You dont have any requested" };
    }
    return myRequested;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
