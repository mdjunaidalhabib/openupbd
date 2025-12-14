import express from "express";
import Order from "../../models/Order.js";

const router = express.Router();

/**
 * ================================
 * GET all orders
 * Optional filters:
 *  - userId
 *  - status
 *  - paymentStatus
 * ================================
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: err.message,
    });
  }
});

/**
 * ================================
 * GET single order
 * ================================
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({
      error: "Failed to fetch order",
      details: err.message,
    });
  }
});

/**
 * ================================
 * UPDATE order (ADMIN)
 * ================================
 */
router.put("/:id", async (req, res) => {
  try {
    const current = await Order.findById(req.params.id);
    if (!current) return res.status(404).json({ error: "Order not found" });

    const updateData = {};

    // ----------------------------
    // Simple fields
    // ----------------------------
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    if (req.body.trackingId !== undefined) {
      updateData.trackingId = req.body.trackingId;
    }

    if (req.body.paymentMethod !== undefined) {
      updateData.paymentMethod = req.body.paymentMethod;
    }

    if (req.body.cancelReason !== undefined) {
      updateData.cancelReason = req.body.cancelReason;
    }

    // ----------------------------
    // Billing (safe merge)
    // ----------------------------
    if (req.body.billing) {
      updateData.billing = {
        name: req.body.billing.name?.trim()
          ? req.body.billing.name
          : current.billing?.name,

        phone: req.body.billing.phone?.trim()
          ? req.body.billing.phone
          : current.billing?.phone,

        address: req.body.billing.address?.trim()
          ? req.body.billing.address
          : current.billing?.address,

        note: req.body.billing.note?.trim()
          ? req.body.billing.note
          : current.billing?.note,
      };
    }

    /**
     * ================================
     * STATUS FLOW (STRICT)
     * ================================
     */
    const STATUS_FLOW = {
      pending: ["ready_to_delivery", "cancelled"],
      ready_to_delivery: ["send_to_courier", "cancelled"],
      send_to_courier: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    if (
      updateData.status !== undefined &&
      updateData.status !== current.status
    ) {
      const allowedNext = STATUS_FLOW[current.status] || [];
      if (!allowedNext.includes(updateData.status)) {
        return res.status(400).json({
          error: `Invalid status change: ${current.status} → ${updateData.status}`,
        });
      }
    }

    /**
     * ================================
     * FINAL STATE PROTECTION
     * ================================
     */
    if (
      ["delivered", "cancelled"].includes(current.status) &&
      Object.keys(updateData).some((k) => k !== "status")
    ) {
      return res.status(400).json({
        error: "Delivered or cancelled order cannot be edited",
      });
    }

    /**
     * ================================
     * ✅ FINAL CANCEL REASON GUARD
     * ================================
     */
    if (updateData.status === "cancelled") {
      // Admin cancelled without reason
      if (!updateData.cancelReason?.trim()) {
        updateData.cancelReason = "Cancelled by admin";
      }
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    res.status(400).json({
      error: "Failed to update order",
      details: err.message,
    });
  }
});

/**
 * ================================
 * DELETE order (ADMIN ONLY)
 * ================================
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete order:", err);
    res.status(500).json({
      error: "Failed to delete order",
      details: err.message,
    });
  }
});

export default router;
