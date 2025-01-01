import User from "@/database/user.model";
import { createAdmin } from "./user.action";
import { UserRegisterDTO } from "@/dtos/UserDTO";
import mongoose from "mongoose";

export const initiateSystem = async () => {
    try {
        const users = await User.find();
        console.log("uers: ", users);
        if (users.length !== 0) {
            return {message:"Your system has been run!"}
        }
        
    } catch (error) {
        const initiateAdminData: UserRegisterDTO = {
            firstName: "Kapy",
            lastName: "Admin",
            nickName: "kapyadmin",
            phoneNumber: "0000000000",
            email: "kapyteam.tech@gmail.com",
            password: "admin",
            rePassword: "admin",
            gender: true,
            birthDay: new Date(),
        }
        const initiateAdmin = createAdmin(initiateAdminData, "507f1f77bcf86cd799439011");
        return initiateAdmin;
    }
}