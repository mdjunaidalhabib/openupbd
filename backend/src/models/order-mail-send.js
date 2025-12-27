import mongoose from "mongoose";

const OrderMailSendSchema = new mongoose.Schema(
  {
    adminEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.OrderMailSend ||
  mongoose.model("OrderMailSend", OrderMailSendSchema);
