import express from "express";
import Order from "../../models/Order.js";
// যদি protect middleware থাকে, ইউজারের অর্ডার দেখার জন্য ব্যবহার করো
// import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/orders
 * ইউজার অর্ডার প্লেস করবে
 */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      subtotal,
      deliveryCharge,
      total,
      billing,
      discount,
      promoCode,
      userId,
      paymentMethod,
      paymentStatus,
      status,
      trackingId,
      cancelReason,
    } = req.body;

    // basic validation
    if (
      !items?.length ||
      subtotal == null ||
      deliveryCharge == null ||
      total == null ||
      !billing?.name
    ) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const orderData = {
      items,
      subtotal,
      deliveryCharge,
      discount: discount || 0,
      total,
      billing,
      promoCode: promoCode || "",
      userId: userId || null, // protect দিলে এখানে req.user._id বসাতে পারো
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentStatus || "pending",
      status: status || "pending",
      trackingId: trackingId || "",
      cancelReason: cancelReason || "",
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    return res.status(201).json({ order: newOrder });
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(400).json({
      error: "Failed to create order",
      details: err.message,
    });
  }
});

/**
 * ✅ NEW
 * GET /api/orders?userId=xxx
 * ইউজার নিজের সব অর্ডার দেখবে (query দিয়ে)
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    return res.status(500).json({
      error: "Failed to fetch orders",
      details: err.message,
    });
  }
});


/**
 * GET /api/orders/:id
 * ইউজার নিজের অর্ডারের ডিটেইল দেখবে
 * (protect দিলে এখানে userId match করানো যাবে)
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    return res.status(500).json({
      error: "Failed to fetch order",
      details: err.message,
    });
  }
});

export default router;
