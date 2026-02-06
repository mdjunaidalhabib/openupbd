import express from "express";
import Order from "../../models/Order.js";

const router = express.Router();

router.get("/live", async (req, res) => {
  const { trackingId } = req.query;
  if (!trackingId)
    return res.status(400).json({ ok: false, error: "trackingId is required" });

  try {
    const order = await Order.findOne({
      "courier.trackingId": trackingId,
    }).lean();
    if (!order)
      return res.status(404).json({ ok: false, error: "Order not found" });

    // Example: use rawResponse.events if your courier API returns events
    const events = order.courier?.rawResponse?.consignment?.events || [
      // fallback sample
      {
        status: order.courier?.status || "in_review",
        location: null,
        timestamp: new Date(),
      },
    ];

    res.json({ ok: true, events });
  } catch (err) {
    console.error("🚨 Live tracking fetch error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
