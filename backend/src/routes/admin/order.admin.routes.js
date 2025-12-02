import express from "express";
import Order from "../../models/Order.js";

const router = express.Router();

/**
 * GET /api/v1/admin/orders
 * Admin সব অর্ডার দেখবে + filter করতে পারবে
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};

    // ✅ Filter by userId
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch orders", details: err.message });
  }
});

/**
 * GET /api/v1/admin/orders/:id
 * Admin যেকোনো অর্ডার ডিটেইল দেখবে
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch order", details: err.message });
  }
});

/**
 * PUT /api/v1/admin/orders/:id
 * Admin অর্ডার আপডেট করবে (status/paymentStatus/trackingId etc)
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    res
      .status(400)
      .json({ error: "Failed to update order", details: err.message });
  }
});

/**
 * DELETE /api/v1/admin/orders/:id
 * Admin অর্ডার ডিলিট করবে
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete order:", err);
    res
      .status(500)
      .json({ error: "Failed to delete order", details: err.message });
  }
});

export default router;
