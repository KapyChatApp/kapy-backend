import {  ShortUserResponseDTO} from "./UserDTO";

export interface CreateAuthDTO{
    deviceName:string;
    deviceType:string;
    brand?:string;
    modelName?:string;
    osName?:string;
    osVersion?:string;
    region:string;
}

export interface AuthResponsDTO{
    _id:string;
    logTime:Date;
    deviceName:string;
    deviceType:string;
    brand?:string;
    modelName?:string;
    osName?:string;
    osVersion?:string;
    region:string;
    isSafe:boolean;
    isActive:boolean;
    user:ShortUserResponseDTO;    
}

export interface CountAuthHistoryReponseDTO{
    totalMobile:number;
    totalBrowser:number;
}