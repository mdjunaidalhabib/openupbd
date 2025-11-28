import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("🔥 MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
