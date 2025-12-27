import mongoose from "mongoose";

const deliveryFeeSchema = new mongoose.Schema(
  {
    fee: { type: Number, default: 120 },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryFee ||
  mongoose.model("DeliveryFee", deliveryFeeSchema);
