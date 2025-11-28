import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/**
 * GET /api/orders
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
 * GET /api/orders/:id
 */
http: router.get("/:id", async (req, res) => {
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
 * POST /api/orders
 */
router.post("/", async (req, res) => {
  try {
    const { items, subtotal, deliveryCharge, total, billing } = req.body;
    if (!items?.length || !subtotal || !deliveryCharge || !total || !billing?.name) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const orderData = {
      items: req.body.items,
      subtotal: req.body.subtotal,
      deliveryCharge: req.body.deliveryCharge,
      discount: req.body.discount || 0,
      total: req.body.total,
      billing: req.body.billing,
      promoCode: req.body.promoCode || "",
      userId: req.body.userId || null,
      paymentMethod: req.body.paymentMethod || "cod",
      paymentStatus: req.body.paymentStatus || "pending",
      status: req.body.status || "pending",
      trackingId: req.body.trackingId || "",
      cancelReason: req.body.cancelReason || "",
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json({ order: newOrder });
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    res.status(400).json({ error: "Failed to create order", details: err.message });
  }
});

/**
 * PUT /api/orders/:id
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
    res.status(400).json({ error: "Failed to update order", details: err.message });
  }
});

/**
 * DELETE /api/orders/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete order:", err);
    res.status(500).json({ error: "Failed to delete order", details: err.message });
  }
});

export default router;
