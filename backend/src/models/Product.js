import mongoose from "mongoose";

// --- রিভিউ স্কিমা ---
const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    comment: { type: String, default: "" },
  },
  { _id: false }
);

// --- কালার ভেরিয়েন্ট স্কিমা ---
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    images: { type: [String], default: [] }, // নির্দিষ্ট কালারের ছবিগুলো
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: true } // আইডি থাকলে ভবিষ্যতে নির্দিষ্ট ভেরিয়েন্ট আপডেট করা সহজ হয়
);

// --- মেইন প্রোডাক্ট স্কিমা ---
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },

    // মেইন ইমেজ (কালার ভেরিয়েন্ট না থাকলে এটি ব্যবহৃত হবে)
    image: { type: String, default: "" },

    // গ্যালারি ইমেজ (কালার ভেরিয়েন্ট না থাকলে এটি ব্যবহৃত হবে)
    images: { type: [String], default: [] },

    // কালার ভেরিয়েন্ট ডাটা
    colors: { type: [colorSchema], default: [] },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    reviews: [reviewSchema],

    stock: { type: Number, default: 0, min: 0 }, // টোটাল স্টক (বা ডিফল্ট স্টক)
    sold: { type: Number, default: 0, min: 0 },
    isSoldOut: { type: Boolean, default: false },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    order: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // createdAt এবং updatedAt অটো তৈরি হবে
);

// ইডেক্সিং (সার্চ পারফরম্যান্স বাড়ানোর জন্য)
productSchema.index({ name: "text", category: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
