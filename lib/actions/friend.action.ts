import Relation from "@/database/relation.model";
import { FriendRequestDTO, FriendResponseDTO } from "@/dtos/FriendDTO";
import { findPairUser } from "./user.action";
import User from "@/database/user.model";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";
export async function addFriend(param: FriendRequestDTO) {
  try {
    const [stUser, ndUser] = [param.sender, param.receiver].sort();
    const existedFriendRelation = await Relation.findOne({
      stUser: stUser,
      ndUser: ndUser,
      relation: "friend",
    });
    await findPairUser(param.sender, param.receiver);
    if (existedFriendRelation) {
      return { message: "Relation is sent!" };
    }
    await Relation.create({
      stUser: stUser,
      ndUser: ndUser,
      relation: "friend",
      sender: param.sender,
      receiver: param.receiver,
      createBy: param.sender,
    });
    return { message: `Request friend to ${param.receiver} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function addBFF(param: FriendRequestDTO) {
  try {
    const [stUser, ndUser] = [param.sender, param.receiver].sort();
    await findPairUser(param.sender, param.receiver);
    const existedBFFRelation = await Relation.findOne({
      stUser: stUser,
      ndUser: ndUser,
      relation: "bff",
    });
    if (existedBFFRelation) {
      return { message: "Relation is sent!" };
    }
    const existedFriendRelation = await Relation.findOne({
      stUser: stUser,
      ndUser: ndUser,
      relation: "friend",
      status: true,
    });
    if (!existedFriendRelation) {
      return { message: "You must be their friend first!" };
    }
    await Relation.create({
      stUser: stUser,
      ndUser: ndUser,
      relation: "bff",
      sender: param.sender,
      receiver: param.receiver,
      createBy: param.sender,
    });
    return { message: `Request bestfriend to ${param.receiver} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function block(param: FriendRequestDTO) {
  try {
    const [stUser, ndUser] = [param.sender, param.receiver].sort();
    await findPairUser(param.sender, param.receiver);
    const existedBlockRelation = await Relation.findOne({
      stUser: stUser,
      ndUser: ndUser,
      relation: "block",
      status: true,
    });
    if (existedBlockRelation) {
      return { message: "you have been blocked them!" };
    }
    await Relation.create({
      stUser: stUser,
      ndUser: ndUser,
      relation: "block",
      sender: param.sender,
      receiver: param.receiver,
      status: true,
      createBy: param.sender,
    });
    const user = await User.findById(param.sender);
    await user.blockedIds.addToSet(param.receiver);
    await user.save();
    await unFriend(param);
    return { message: `Block ${param.receiver} successfully!` };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function acceptFriendRequest(param: FriendRequestDTO) {
  try {
    const { stUser, ndUser } = await findPairUser(param.sender, param.receiver);
    const existedFriendRequest = await Relation.findOne({
      receiver: param.receiver,
      sender: param.sender,
      relation: "friend",
      status: false,
    });
    if (!existedFriendRequest) {
      throw new Error("Cannot find friend relation");
    }
    existedFriendRequest.set("status", true);

    await stUser.friendIds.addToSet(ndUser._id);
    await ndUser.friendIds.addToSet(stUser._id);

    await existedFriendRequest.save();
    await stUser.save();
    await ndUser.save();

    return { message: "Accepted" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function acceptBFFRequest(param: FriendRequestDTO) {
  try {
    const { stUser, ndUser } = await findPairUser(param.sender, param.receiver);
    const existedBFFRequest = await Relation.findOne({
      receiver: param.receiver,
      sender: param.sender,
      relation: "bff",
    });
    if (!existedBFFRequest) {
      throw new Error("Cannot find bestfriend relation");
    }
    existedBFFRequest.set("status", true);

    stUser.bestFriendIds.addToSet(ndUser._id);
    ndUser.bestFriendIds.addToSet(stUser._id);

    await existedBFFRequest.save();
    await stUser.save();
    await ndUser.save();

    return { message: "Accepted" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function unFriend(param: FriendRequestDTO) {
  try {
    const { stUser, ndUser } = await findPairUser(param.sender, param.receiver);
    const [stUserId, ndUserId] = [param.sender, param.receiver].sort();
    await Relation.findOneAndDelete({
      stUser: stUserId,
      ndUser: ndUserId,
      relation: "friend",
    });
    await Relation.findOneAndDelete({
      stUser: stUserId,
      ndUser: ndUserId,
      relation: "bff",
    });
    if (stUser && ndUser) {
      stUser.friendIds = stUser.friendIds.filter(
        (id: string) => id.toString() !== ndUser._id.toString()
      );
      stUser.bestFriendIds = stUser.bestFriendIds.filter(
        (id: string) => id.toString() !== ndUser._id.toString()
      );

      ndUser.friendIds = ndUser.friendIds.filter(
        (id: string) => id.toString() !== stUser._id.toString()
      );
      ndUser.bestFriendIds = ndUser.bestFriendIds.filter(
        (id: string) => id.toString() !== stUser._id.toString()
      );
      await stUser.save();
      await ndUser.save();
      return { message: "Unfriend successfully!" };
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function unBFF(param: FriendRequestDTO) {
  try {
    const { stUser, ndUser } = await findPairUser(param.sender, param.receiver);
    const [stUserId, ndUserId] = [param.sender, param.receiver].sort();
    await Relation.findOneAndDelete({
      stUser: stUserId,
      ndUser: ndUserId,
      relation: "bff",
    });
    if (stUser && ndUser) {
      stUser.bestFriendIds = stUser.bestFriendIds.filter(
        (id: string) => id.toString() !== ndUser._id.toString()
      );

      ndUser.bestFriendIds = ndUser.bestFriendIds.filter(
        (id: string) => id.toString() !== stUser._id.toString()
      );
      await stUser.save();
      await ndUser.save();
      return { message: "Unfriend successfully!" };
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function unBlock(param: FriendRequestDTO) {
  try {
    const { stUser, ndUser } = await findPairUser(param.sender, param.receiver);
    console.log("sender", param.sender);
    console.log("receiver", param.receiver);
    const deletedRelation = await Relation.findOneAndDelete({
      sender: param.sender,
      receiver: param.receiver,
      relation: "block",
    });
    stUser.blockedIds = ndUser.blockedIds.filter(
      (id: string) => id.toString() !== ndUser._id.toString()
    );
    await stUser.save();
    console.log(deletedRelation);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function find(
  q: string,
  userId: Schema.Types.ObjectId | undefined
) {
  try {
    const friends = await User.find({
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ],
    });

    console.log("friends: ", friends);

    const friendResponses: FriendResponseDTO[] = [];

    for (const friend of friends) {
      const mutualFriends = await getMutualFriends(
        userId?.toString(),
        friend._id
      );

      const friendResponse: FriendResponseDTO = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        nickName: friend.nickName,
        mutualFriends: mutualFriends!,
      };

      if (friend.friendIds.includes(userId)) {
        friendResponses.push(friendResponse);
      }
    }

    return friendResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getMutualFriends = async (
  userId: string | undefined,
  targetUserId: string
) => {
  try {

    await connectToDatabase();
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId)
    if (!user || !targetUser) {
      console.log("User or Target User not found.");
      return [];
    }


    const userFriendIds = user.friendIds.flat().map((id: Schema.Types.ObjectId) => id.toString());
    const targetFriendIds = targetUser.friendIds
      .flat()
      .map((id: Schema.Types.ObjectId) => id.toString());


    const targetFriendSet = new Set<string>(targetFriendIds);

    const mutualFriendIds: string[] = userFriendIds.filter((id: string) =>
      targetFriendSet.has(id)
    );

    const mutualFriends:ShortUserResponseDTO[] = [];
    for(const id of mutualFriendIds){
      const user = await User.findById(id);
      const mutualFriend:ShortUserResponseDTO={
        _id:user._id,
        firstName:user.firstName,
        lastName:user.lastName,
        nickName:user.nickName,
        avatar:user.avatar,
      }
      mutualFriends.push(mutualFriend);
    }
    
    return mutualFriends || [];
  } catch (error) {
    console.log(error);
  }
};
export const suggestFriends = async (
  userId: Schema.Types.ObjectId | undefined
) => {
  try {
    connectToDatabase();
    const user = await User.findById(userId).select("friendIds");
    if (!user) throw new Error("User not found");

    const friendIds = user.friendIds.flat();
    const friendIdsString = friendIds.map((item: Schema.Types.ObjectId) =>
      item.toString()
    )

    const suggestions = await User.aggregate([
      { $match: { _id: { $in: friendIds } } }, 
    
      { $unwind: "$friendIds" },    // ✅ Sửa: thêm dòng này
      { $unwind: "$friendIds" },    // ✅ Sửa: unwind thêm lần nữa để xử lý mảng lồng
    
      {
        $group: {
          _id: "$friendIds", 
          count: { $sum: 1 }, 
        },
      },
    
      {
        $match: {
          $and: [
            { _id: { $ne: userId } }, 
            { _id: { $nin: user.friendIds.flat() } }, 
            { count: { $gte: 3 } }, 
          ],
        },
      },
    
      { $sort: { count: -1 } }, 
    
      { $limit: 10 }, 
    
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id", 
          as: "userDetails",
        },
      },
    
      { $unwind: "$userDetails" }, 
    ]);

    console.log("User friendIds", user.friendIds);
console.log("Suggestions result:", suggestions);


    const suggestionResponses: FriendResponseDTO[] = [];
    for (const suggest of suggestions) {
      if (
        suggest.userDetails._id.toString() !== userId?.toString() &&
        !friendIdsString.includes(suggest.userDetails._id.toString())
      ) {
        const mutualFriend = await getMutualFriends(
          userId?.toString(),
          suggest.userDetails._id
        );

        const suggestionResponse: FriendResponseDTO = {
          _id: suggest.userDetails._id,
          firstName: suggest.userDetails.firstName,
          lastName: suggest.userDetails.lastName,
          nickName: suggest.userDetails.nickName,
          avatar: suggest.userDetails.avatar,
          mutualFriends: mutualFriend!, // Số bạn chung
        };
        suggestionResponses.push(suggestionResponse);
      }
    }

    return suggestionResponses;
  } catch (error) {
    console.error(error);
  }
};

