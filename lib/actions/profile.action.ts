import Relation from "@/database/relation.model";
import User from "@/database/user.model";
import { FriendProfileRequestDTO } from "@/dtos/FriendDTO";
import { connectToDatabase } from "../mongoose";

export async function getFriendProfile(param:FriendProfileRequestDTO){
    try{
        if(param.friendId===param.userId){
            throw new Error('You cannot use this api to get your profile!');
        }
        connectToDatabase();
        const [stUserId, ndUserId] = [param.friendId, param.userId].sort();
        const relations = await Relation.find({stUser:stUserId, ndUser:ndUserId});
        relations.map((item)=>{if(item.relation==="bff") {
            return //Process posts return for bestfriend
        }})
        console.log(relations);
        if(relations.length!=0){
            return await User.findById(param.friendId);
        }
        return {message:"You cannot see their profile because of stranger!"}
    }catch(error){
        console.log(error);
        throw error;
    }
}
//Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWIzZWFmY2JhOThlNzMyM2ZiNzVjMSIsInVzZXJuYW1lIjoiMDk4OTc4OTY1Iiwicm9sZXMiOlsidXNlciJdLCJpYXQiOjE3Mjk4NDA4ODIsImV4cCI6MTcyOTg0ODA4Mn0.P2rF9Mau8jY78r4FnNobpHEeDOcETzxCW6c4gYp03dI

//671b3ed9cba98e7323fb75c5