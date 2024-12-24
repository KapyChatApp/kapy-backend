import Location from "@/database/location.model";
import { LocationDTO, PusherLocationDTO } from "@/dtos/LocationDTO";
import { Schema } from "mongoose";
import { pusherServer } from "../pusher";

export const locationLiveUpdate = async (userId:Schema.Types.ObjectId|undefined, location:LocationDTO)=>{
    try{
        const existLocation = await Location.findOne({createBy:userId}); 
        let finallyLocation = null;
        if(existLocation){
            if(existLocation.createBy.toString()!=userId?.toString()){
               throw new Error('You cannot update this location!');
            }
            finallyLocation = await Location.findOneAndUpdate(existLocation._id, location);
     
        }else{
            const locationWithAudit =  Object.assign(location,{createBy:userId});
            finallyLocation = await Location.create(locationWithAudit);
            
        }
        const pusherLocation:PusherLocationDTO = await Object.assign(finallyLocation,{userId:userId});
        await pusherServer.trigger(`private-${userId}`,"location",pusherLocation);
        return finallyLocation;
    }catch(error){
       console.log(error);
       throw error; 
    }
}
