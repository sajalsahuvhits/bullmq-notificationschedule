import mongoose from "mongoose";

export const dbConnection = async () => {
  const url = process.env.MONGO_URL;
  try {
    await mongoose.connect(url);
    console.log(`✅ Database connected`)
  } catch (error) {
    console.log(error);
  }
};
