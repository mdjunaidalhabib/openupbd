import express from "express";
import Order from "../models/Order.js";
import { generateReceiptPDF } from "../pdfTemplates/receiptContent.js";

const router = express.Router();

/**
 * GET /api/receipts/:orderId
 * 🧾 View or Download Receipt PDF
 * Example:
 *   /api/receipts/12345        → view mode
 *   /api/receipts/12345?download=true → download mode
 */
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const fileName = `HabibsFashion-${order._id}.pdf`;
    const isDownload = req.query.download === "true";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${fileName}"`
    );

    generateReceiptPDF(order, res);
  } catch (err) {
    console.error("❌ Failed to generate receipt:", err);
    res.status(500).json({ error: "Failed to generate receipt", details: err.message });
  }
});

export default router;
