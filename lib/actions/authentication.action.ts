"use server"

import { CreateUserDTO } from "@/dtos/UserDTO"
import { connectToDatabase } from "../mongoose"
import User from "@/database/user.model";
import bcrypt from "bcrypt";
const saltRounds = 10;
export async function  createUser(params:CreateUserDTO ){
    try{
        connectToDatabase();

        const existedUser = await User.findOne({$or:[{email:params.email}, {phonrNumber:params.phoneNumber}]});

        if(params.password!==params.rePassword){
            throw new Error('Your re-password is wrong!');
        }

        if(existedUser){
            throw new Error('User is already exist!');
        }

        const hashPassword = await bcrypt.hash(params.password, saltRounds);
  
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {rePassword,password,...userData} = params;

        const createUserData = Object.assign({}, userData, {password:hashPassword, attendDate:new Date()});

        const newUser = await User.create(createUserData);

        return newUser;
    }catch(error){
        console.log(error);
    }
}