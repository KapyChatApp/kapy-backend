import mongoose from "mongoose";
const isConnected: boolean = false;
export const connectToDatabase = async () => {
  mongoose.set("strictQuery", true);
  if (!process.env.DATABASE_URL) {
    return console.log("DATABASE_URL IS MISSING!");
  }
  if (isConnected) {
    return console.log("DATABASE IS ALREADY CONNECTED!");
  }
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      dbName: "kapy-chat-app",
    });
    console.log("DATABASE IS CONNECTED!");
  } catch (error) {
    console.log("ERROR", error);
  }
};
