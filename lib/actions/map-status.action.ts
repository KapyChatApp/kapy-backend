import MapStatus from "@/database/map-status.model";
import { LocationDTO } from "@/dtos/LocationDTO";
import { Schema } from "mongoose";
import { locationLiveUpdate } from "./location.action";


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

