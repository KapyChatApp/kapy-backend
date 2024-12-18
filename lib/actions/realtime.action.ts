import Realtime from "@/database/realtime.model";
import User from "@/database/user.model";
import mongoose, { Schema } from "mongoose";

export const getRealTimeOfFriends = async (userId:Schema.Types.ObjectId |undefined)=>{
try{
    const user = await User.findById(userId);
    console.log(user.friendIds.flat());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await Realtime.find({userId:{$in:user.friendIds.flat()}});
}catch(error){
    console.log(error);
    throw error;
}
}

export const gelRealTimeOfUser = async (userId:string)=>{
try{
    const realtime = await Realtime.findOne({userId:new mongoose.Types.ObjectId(userId)});
    return realtime;   
}catch(error){
    console.log(error);
    throw error;
}
}