import Relation from "@/database/relation.model";
import User from "@/database/user.model";
import { connectToDatabase } from "../mongoose";
import { PublicUserDTO } from "@/dtos/UserDTO";
import { Schema } from "mongoose";

export async function getFriendProfile(friendId:string, userId:Schema.Types.ObjectId | undefined){
    try{
        connectToDatabase();
        const [stUserId, ndUserId] = [friendId, userId].sort();
        const relations = await Relation.find({stUser:stUserId, ndUser:ndUserId});
        if(relations.length===0){
            const stranger: PublicUserDTO|null = await User.findById(friendId);
            if(!stranger){
                throw new Error('User not exist');
            }
            Object.assign(stranger, {relations:[]})
            return stranger;
        }
        relations.map((item)=>{if(item.relation==="bff") {
            return //Process posts return for bestfriend
        }})
        console.log(relations);
        if(relations.length!=0){
            return await User.findById(friendId);
        }
        return {message:"You cannot see their profile because of stranger!"}
    }catch(error){
        console.log(error);
        throw error;
    }
}