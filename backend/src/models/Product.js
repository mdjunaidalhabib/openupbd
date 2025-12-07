import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    comment: { type: String, default: "" },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    name: String,
    images: [String],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    image: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    description: { type: String, default: "" },
    additionalInfo: { type: String, default: "" },
    reviews: [reviewSchema],
    images: [{ type: String, default: "" }],
    colors: [colorSchema],

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // ✅ NEW: Product Serial + Status
    order: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
