import mongoose from "mongoose";

export const connectDb = async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DataBase Connected Successfully")
  } catch (error) {
    console.error("DataBase Connecttion Failed",error)
  }
}
