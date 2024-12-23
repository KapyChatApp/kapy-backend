import MapStatus from "@/database/map-status.model";
import { LocationDTO } from "@/dtos/LocationDTO";
import { Schema } from "mongoose";
import { locationLiveUpdate } from "./location.action";
import User from "@/database/user.model";
import { MapStatusResponseDTO } from "@/dtos/MapStatusDTO";
import { createPublicKey } from "crypto";


export const initiateMyMapStatus = async (userId: Schema.Types.ObjectId | undefined, location: LocationDTO) => {
    try {
        const existMapStatus = await MapStatus.findOne({ createBy: userId });
        if (existMapStatus) {
            await locationLiveUpdate(userId, location);
            return await MapStatus.findById(existMapStatus._id).populate("content").populate("location");
        } else {
            const createdLocation = await locationLiveUpdate(userId, location);
            const createdMapStatus = await MapStatus.create({ location: createdLocation._id, createBy: userId });
            return await MapStatus.findById(createdMapStatus._id).populate("content").populate("location");
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const getMyBestFriendMapStatus = async (userId:Schema.Types.ObjectId| undefined)=>{
    try{
        const user = await User.findById(userId);
        const bffMapStatuses = await MapStatus.find({createBy:{$in:user.bestFriendIds}}).populate("content").populate("location").populate("createBy");
        const bffMapStatusResponses:MapStatusResponseDTO[] = [];
        for(const map of bffMapStatuses){
            const bffMapStatusResponse:MapStatusResponseDTO={
                _id:map._id,
                caption:map.caption,
                content:map.content,
                location:map.location,
                createAt:map.createAt.toString(),
                createBy:{
                    _id:map.createBy._id,
                    firstName:map.createBy.firstName,
                    lastName:map.createBy.lastName,
                    nickName:map.createBy.nickName, 
                    avatar:map.createBy.avatar
                }
            }
            bffMapStatusResponses.push(bffMapStatusResponse);
        }
        return bffMapStatusResponses;
    }catch(error){
        console.log(error);
        throw error;
    }
}

