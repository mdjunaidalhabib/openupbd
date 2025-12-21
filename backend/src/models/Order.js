import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: { type: String, required: true },
        name: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],

    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    billing: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      deliveryArea: { type: String, default: "inside" }, // 'inside' or 'outside'
      note: String,
    },

    promoCode: String,
    userId: { type: String }, // User ID সাধারণত String হয় (MongoDB ID)

    // 💳 Payment
    paymentMethod: {
      type: String,
      enum: ["cod", "free", "bkash"], // 'free' এবং 'cod' সাপোর্ট করবে
      default: "free",
    },

    // 📦 Order Status
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

    trackingId: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
