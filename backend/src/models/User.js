import mongoose from "mongoose";
import Counter from "./Counter.js";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, unique: true, index: true }, // ✅ auto incremented ID
    name: { type: String, default: "" },
    // Make email optional but uniquely indexed (sparse) to avoid duplicates on missing emails
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    // ✅ Avatar field with default image (use your CDN/static fallback if possible)
    avatar: {
      type: String,
      default: "https://i.pravatar.cc/150?u=default",
    },
  },
  { timestamps: true }
);

// ✅ Pre-save hook to auto-increment userId safely
userSchema.pre("save", async function (next) {
  if (this.isNew && (this.userId === undefined || this.userId === null)) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "userId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.userId = counter?.seq ?? 1;
    } catch (e) {
      // fallback if counter fails
      this.userId = Math.floor(Date.now() / 1000);
    }
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
