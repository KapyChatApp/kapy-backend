import OTP from "@/database/opt.mode";
import { connectToDatabase } from "../mongoose";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}

export async function sendSMS(
  phoneNumber: string,
) {
  try {
    const otp = generateOTP();
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `App ${process.env.INFOBIP_APIKEY}`);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");
    
    const raw = JSON.stringify({
      messages: [
        {
          destinations: [{ to: phoneNumber }],
          from: process.env.SENDER_PHONENUMBER,
          text: `Your verification code is ${otp}`,
        },
      ],
    });

    fetch("https://api.infobip.com/sms/2/text/advanced", {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    })
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

    connectToDatabase();
    const createdOTP = await OTP.create({
      code: otp,
      sender: process.env.SENDER_PHONENUMBER,
      receiver: phoneNumber,
    });

    return createdOTP;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
