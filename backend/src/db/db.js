import mongoose from "mongoose";

export const connectDb = async ()=>{
  try {
    console.log(`connecting the db ${process.env.MONGO_URL}`);
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DataBase Connected Successfully")
  } catch (error) {
    console.error("DataBase Connecttion Failed",error)
  }
}
