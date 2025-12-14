import express from "express";
import Order from "../../models/Order.js";
// import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * ================================
 * POST /api/orders
 * Create new order
 * ================================
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

    if (
      !items?.length ||
      subtotal == null ||
      deliveryCharge == null ||
      total == null ||
      !billing?.name
    ) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const order = new Order({
      items,
      subtotal,
      deliveryCharge,
      discount: discount || 0,
      total,
      billing,
      promoCode: promoCode || "",
      userId: userId || null,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentStatus || "pending",
      status: status || "pending",
      trackingId: trackingId || "",
      cancelReason: cancelReason || "",
    });

    await order.save();
    return res.status(201).json(order);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * ================================
 * GET /api/orders?userId=xxx
 * User order list
 * ================================
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
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * ================================
 * GET /api/orders/:id
 * Single order detail
 * ================================
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (err) {
    console.error("❌ Failed to fetch order:", err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * ================================
 * PUT /api/orders/:id
 * ✅ Update order (ONLY pending)
 * ✅ Cancel order (status=cancelled) (ONLY pending)
 * ================================
 */
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 🔒 Only pending orders can be changed/cancelled
    if (order.status !== "pending") {
      return res
        .status(403)
        .json({ error: "Only pending orders can be updated/cancelled" });
    }

    const {
      billing,
      items,
      trackingId,
      paymentMethod,
      paymentStatus,
      status,
      cancelReason,
    } = req.body;

    // ✅ Update billing
    if (billing) order.billing = billing;

    // ✅ Optional updates (if needed)
    if (items) order.items = items;
    if (trackingId !== undefined) order.trackingId = trackingId;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // ✅ Cancel order
    if (status) {
      // only allow cancelling from frontend
      if (status === "cancelled") {
        order.status = "cancelled";
        order.cancelReason = cancelReason || "Cancelled by customer";
      } else {
        return res.status(400).json({
          error: "Only 'cancelled' status is allowed from this endpoint",
        });
      }
    }

    // cancelReason alone (optional)
    if (cancelReason && !status) order.cancelReason = cancelReason;

    await order.save();
    return res.json(order);
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    return res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * ================================
 * ❌ DELETE route removed (because now we cancel, not delete)
 * If you still want to keep delete, tell me.
 * ================================
 */

export default router;
