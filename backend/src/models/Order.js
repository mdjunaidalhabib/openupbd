import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String },
        price: { type: Number },
        qty: { type: Number },
        image: { type: String },

        // ✅ Optional but useful
        color: { type: String, default: null },
        stock: { type: Number, default: 0 },
      },
    ],

    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true, default: 120 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    billing: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      note: { type: String, default: "" },
    },

    promoCode: { type: String, default: null },
    userId: { type: String, default: null },

    // ✅ Payment Method (Only COD & BKASH)
    paymentMethod: {
      type: String,
      enum: ["cod", "bkash"],
      default: "cod",
      index: true,
    },

    // ✅ Payment Status
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },

    // ✅ Order Status (processing বাদ)
    status: {
      type: String,
      enum: [
        "pending",
        "ready_to_delivery",
        "send_to_courier",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    trackingId: { type: String, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
