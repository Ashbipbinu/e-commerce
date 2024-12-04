import mongoose from "mongoose";

export const connectDB = async () => {
    try {
       const conn =  await mongoose.connect(process.env.MONGO_URI)
       console.log(`MongoDB Connected to ${conn.connection.host}`)
    } catch (error) {
        console.log("Failed to connect with MongoDB", error.message);
        process.exit(1)
    }
}