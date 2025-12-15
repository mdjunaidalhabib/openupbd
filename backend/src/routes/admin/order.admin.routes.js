import express from "express";
import Order from "../../models/Order.js";

const router = express.Router();

/**
 * ================================
 * STATUS FLOW (SINGLE SOURCE)
 * ================================
 */
const STATUS_FLOW = {
  pending: ["ready_to_delivery", "cancelled"],
  ready_to_delivery: ["send_to_courier", "cancelled"],
  send_to_courier: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * ================================
 * GET all orders
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
 * 🔥 BULK STATUS UPDATE (ADMIN)
 * ================================
 * body: { ids: [], status, cancelReason? }
 */
router.put("/bulk/status", async (req, res) => {
  try {
    const { ids, status, cancelReason } = req.body;

    if (!Array.isArray(ids) || !status) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const orders = await Order.find({ _id: { $in: ids } });

    const result = {
      updated: [],
      skipped: [],
      errors: [],
    };

    for (const o of orders) {
      try {
        if (["delivered", "cancelled"].includes(o.status)) {
          result.skipped.push(o._id);
          continue;
        }

        const allowedNext = STATUS_FLOW[o.status] || [];
        if (!allowedNext.includes(status)) {
          result.skipped.push(o._id);
          continue;
        }

        const update = { status };

        if (status === "cancelled") {
          update.cancelReason = cancelReason?.trim() || "Cancelled by admin";
        }

        const updated = await Order.findByIdAndUpdate(o._id, update, {
          new: true,
        });

        result.updated.push(updated._id);
      } catch (e) {
        result.errors.push({ id: o._id, error: e.message });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Bulk status update failed:", err);
    res.status(500).json({
      error: "Bulk update failed",
      details: err.message,
    });
  }
});

/**
 * ================================
 * 🔥 BULK DELETE (ADMIN)
 * ================================
 * body: { ids: [] }
 */
router.post("/bulk/delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const result = await Order.deleteMany({
      _id: { $in: ids },
    });

    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error("❌ Bulk delete failed:", err);
    res.status(500).json({
      error: "Bulk delete failed",
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

    if (req.body.status !== undefined) updateData.status = req.body.status;

    if (req.body.trackingId !== undefined)
      updateData.trackingId = req.body.trackingId;

    if (req.body.paymentMethod !== undefined)
      updateData.paymentMethod = req.body.paymentMethod;

    if (req.body.cancelReason !== undefined)
      updateData.cancelReason = req.body.cancelReason;

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

    if (
      ["delivered", "cancelled"].includes(current.status) &&
      Object.keys(updateData).some((k) => k !== "status")
    ) {
      return res.status(400).json({
        error: "Delivered or cancelled order cannot be edited",
      });
    }

    if (updateData.status === "cancelled") {
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
 * DELETE order (ADMIN)
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
