export interface OTPResponseDTO{   
    code:string,
    sender:string,
    receiver:string,
    createAt:Date,
    expiredAt:Date,
}
export interface VerifyOTPResponseDTO{
    message:string;
}