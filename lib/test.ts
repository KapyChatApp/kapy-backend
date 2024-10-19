import { connectToDatabase } from "./mongoose";

export const test = () => {
  connectToDatabase();
};
