import express from "express";
import Order from "../../models/Order.js";

const router = express.Router();

/* ======================================================
   DEBUG LOGGER
====================================================== */
router.use((req, res, next) => {
  console.log("🚚 COURIER STATUS ROUTE HIT:", req.method, req.originalUrl);
  next();
});

/* ======================================================
   GET /api/courier/status?trackingId=...
====================================================== */
router.get("/status", async (req, res) => {
  const { trackingId } = req.query;

  if (!trackingId) {
    console.log("❌ Courier status request missing trackingId");
    return res.status(400).json({ ok: false, error: "trackingId is required" });
  }

  try {
    // 🔍 Find order with this trackingId
    const order = await Order.findOne({
      "courier.trackingId": trackingId,
    }).lean();

    if (!order) {
      console.log("❌ No order found for trackingId:", trackingId);
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    console.log("✅ Order found for trackingId:", trackingId);

    return res.json({
      ok: true,
      status: order.courier?.status || "in_review",
      courier: order.courier || null,
      orderId: order._id,
    });
  } catch (err) {
    console.error("🚨 Courier status fetch error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
