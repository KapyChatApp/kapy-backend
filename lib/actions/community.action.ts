import Point from "@/database/point.model";
import User from "@/database/user.model";
import {
  CreatePointDTO,
  EditPointDTO,
  PointResponseDTO,
} from "@/dtos/PointDTO";
import { Schema } from "mongoose";
import { connectToDatabase } from "../mongoose";
import { ShortUserResponseDTO } from "@/dtos/UserDTO";
export async function addPoint(userId: string | undefined, point: number) {
  try {
    connectToDatabase();
    console.log(userId);
    const user = await User.findOne({
      _id: userId,
    });

    if (user === null) {
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

export async function minusPoint(userId: string | undefined, point: number) {
  try {
    connectToDatabase();
    const user = await User.findById(userId);

    if (user === null) {
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

export async function getAllRates() {
  try {
    connectToDatabase();
    const points = await Point.find();
    const pointResponses: PointResponseDTO[] = [];
    for (const point of points) {
      const user = await User.findById(point.createBy);
      const userResponse: ShortUserResponseDTO = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
      };
      const pointResponse: PointResponseDTO = {
        _id: point._id,
        point: point.point,
        message: point.message,
        createAt: point.createAt,
        user: userResponse,
      };
      pointResponses.push(pointResponse);
    }
    return pointResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getRatesOfUser(id: string) {
  try {
    connectToDatabase();
    console.log(id);
    const points = await Point.find({ userId: id });
    console.log(points);
    const pointResponses: PointResponseDTO[] = [];
    for (const point of points) {
      const user = await User.findById(point.createBy);
      const userResponse: ShortUserResponseDTO = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        avatar: user.avatar,
      };
      const pointResponse: PointResponseDTO = {
        _id: point._id,
        point: point.point,
        message: point.message,
        createAt: point.createAt,
        user: userResponse,
      };
      pointResponses.push(pointResponse);
    }
    return pointResponses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const calculateUserPoint = async (userId:Schema.Types.ObjectId| undefined, basePoint:number) => {
  try {
    const ratesOfUser = await getRatesOfUser(userId?.toString()!);
    const sum = ratesOfUser.reduce((sum, item) => sum + item.point, 0) + basePoint;
    const total = ratesOfUser.length + 1;
    return sum / total;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function rateUser(
  param: CreatePointDTO,
  userId: Schema.Types.ObjectId
) {
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

    const createData = Object.assign(param, { createBy: userId });

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


    const point = await Point.findOneAndUpdate(
      { _id: pointId, createBy: userId },
      { point: param.point, message: param.message }
    );
    return { message: "Update successfully!" };
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

    const point = await Point.findOneAndDelete({ _id: pointId, createBy: userId });

    const user = await User.findByIdAndUpdate(point.userId, {
      $pull: { rateIds: pointId },
    });

    await user.save();

    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteRate(pointId: string) {
  try {
    connectToDatabase();
    
    const point = await Point.findOneAndDelete({ _id: pointId });

    const user = await User.findByIdAndUpdate(point.userId, {
      $pull: { rateIds: pointId },
    });


    await user.save();
    return { message: "Deleted!" };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
