import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: String,
  rating: Number,
  comment: String,
});

const colorSchema = new mongoose.Schema({
  name: String,
  images: [String],
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  oldPrice: Number,
  image: String,
  rating: Number,
  description: String,
  additionalInfo: String,
  reviews: [reviewSchema],
  images: [String],
  colors: [colorSchema],

  // 🏷️ Stock field
  stock: {
    type: Number,
    required: true,
    default: 0,   // ডিফল্ট 0 রাখলাম, যাতে না দিলে Out of Stock ধরে নেওয়া যায়
  },

  // 🔗 Category Relation
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);