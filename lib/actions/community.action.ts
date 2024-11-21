import Point from "@/database/point.model";
import User from "@/database/user.model";
import { CreatePointDTO, EditPointDTO } from "@/dtos/PointDTO";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";
export async function addPoint(userId: string|undefined, point: number) {
  try {
    connectToDatabase();
    console.log(userId);
    const user = await User.findOne({
        _id:userId
    });

    if (user===null) {
      return { message: "User not exist!" };
    }

    user.point = user.point + point;

    user.save();

    return { message: "Add point successfully!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function minusPoint(userId: string|undefined, point: number) {
  try {
    connectToDatabase();
    const user = await User.findById(userId);

    if (user===null) {
      return { message: "User not exist!" };
    }

    user.point = user.point - point;

    user.save();

    return { message: "Minus point successfully!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getAllRates(){
    try{
      connectToDatabase();
        const points = await Point.find();
        return points;
    }catch(error){
        console.log(error);
        throw error;
    }
}

export async function rateUser(param: CreatePointDTO, userId:Schema.Types.ObjectId) {
  try {
    connectToDatabase();
    const user = await User.findById(param.userId);

    const existPoint = await Point.findOne({
      userId: param.userId,
      createBy: userId,
    });

    if (existPoint) {
      return { message: " You have rated them!" };
    }

    if (user.friendIds.includes(param.userId)!) {
      return { message: "You must be their friend to rate!" };
    }

    const createData = Object.assign(param,{createBy:userId});

    const point = await Point.create(createData);

    user.rateIds.addToSet(point._id);
    await user.save();

    return point;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function editRateUser(
  param: EditPointDTO,
  pointId: string,
  userId: Schema.Types.ObjectId
) {
  try {
    connectToDatabase();
    await Point.findOneAndUpdate(
      { _id: pointId, createBy: userId },
      { point: param.point, message: param.message }
    );
    return {message:"Update successfully!"};
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteMyRate(
  pointId: string,
  userId: Schema.Types.ObjectId
) {
  try {
    connectToDatabase();
    await Point.findOneAndDelete({ _id: pointId, createBy: userId });

    await User.findByIdAndUpdate(userId, {
      $pull: { rateIds: pointId },
    });

    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteRate(pointId: string) {
  try {
    connectToDatabase();
    await Point.findOneAndDelete({ _id: pointId });
    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}