import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js"; // ✅ ইমপোর্ট নিশ্চিত করুন

const router = express.Router();

/**
 * POST /api/orders
 * Create new order and update product stock
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

    // Validation
    if (!items?.length || subtotal == null || total == null || !billing?.name) {
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

    // ✅ 1. Save the Order
    await order.save();

    // ✅ 2. Update Product Stock (Inventory management)
    try {
      const stockUpdates = items.map((item) => {
        return Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty }, // আইটেম পরিমাণ অনুযায়ী স্টক কমাবে
        });
      });
      await Promise.all(stockUpdates);
    } catch (stockErr) {
      console.error("❌ Stock Update Error:", stockErr);
      // স্টক আপডেট না হলেও অর্ডার হয়ে গেছে, তাই রেসপন্স পাঠানো যাবে
    }

    return res.status(201).json(order);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * GET /api/orders?userId=xxx
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/orders/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * PUT /api/orders/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "pending") {
      return res
        .status(403)
        .json({ error: "Only pending orders can be updated" });
    }

    const { billing, status, cancelReason } = req.body;
    if (billing) order.billing = billing;

    if (status === "cancelled") {
      order.status = "cancelled";
      order.cancelReason = cancelReason || "Cancelled by customer";

      // ✅ Optional: স্টক ফেরত দেওয়া (যদি অর্ডার ক্যানসেল হয়)
      try {
        const restockUpdates = order.items.map((item) => {
          return Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.qty }, // ক্যানসেল হলে স্টক আবার বেড়ে যাবে
          });
        });
        await Promise.all(restockUpdates);
      } catch (e) {
        console.error("Restock failed", e);
      }
    }

    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
