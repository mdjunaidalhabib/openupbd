// File: backend/routes/steadfastRoute.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();
const router = express.Router();

// ✅ Send order to Steadfast Courier (Packzy API)
router.post("/api/send-to-steadfast", async (req, res) => {
  try {
    const { invoice, name, phone, address, cod_amount } = req.body;

    // 🧠 Step 1: Validate incoming data
    if (!invoice || !name || !phone || !address || cod_amount === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: invoice, name, phone, address, cod_amount",
      });
    }

    console.log("🔗 Base URL from .env:", process.env.STEADFAST_BASE_URL);
    console.log("📦 Sending order to Steadfast:", {
      invoice,
      name,
      phone,
      address,
      cod_amount,
    });

    // 🧠 Step 2: Prepare request data (based on Steadfast official docs)
    const payload = {
      invoice, // must be unique
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: cod_amount,
      delivery_type: 0, // 0 = home delivery, 1 = point delivery
      item_description: "General parcel", // optional
      note: "Deliver within office hours", // optional
    };

    // 🧠 Step 3: Make POST request to Steadfast API
    const apiUrl = `${process.env.STEADFAST_BASE_URL}/create_order`;
    const headers = {
      "Api-Key": process.env.STEADFAST_API_KEY,
      "Secret-Key": process.env.STEADFAST_SECRET_KEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(apiUrl, payload, { headers });
    console.log("✅ Steadfast Response:", response.data);

    // 🧠 Step 4: Extract tracking code
    const trackingCode =
      response.data?.consignment?.tracking_code ||
      response.data?.tracking_code ||
      null;

    // 🧠 Step 5: Immediately fetch current delivery status
    let deliveryStatus = "in_review";
    try {
      const statusUrl = `${process.env.STEADFAST_BASE_URL}/status_by_invoice/${invoice}`;
      const statusRes = await axios.get(statusUrl, { headers });
      deliveryStatus = statusRes.data?.delivery_status || "in_review";
    } catch (err) {
      console.log(
        "⚠️ Could not fetch delivery status right now, using default."
      );
    }

    // 🧠 Step 6: Update order in MongoDB
    const updatedOrder = await Order.findByIdAndUpdate(
      invoice,
      { trackingId: trackingCode, status: deliveryStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found in database!" });
    }

    // 🧠 Step 7: Send success response to frontend
    res.json({
      success: true,
      message:
        response.data?.message || "✅ Order sent to Steadfast successfully!",
      trackingId: trackingCode,
      deliveryStatus,
      steadfastResponse: response.data,
    });
  } catch (error) {
    console.error("🚨 Steadfast Error:", error.message);
    console.error("🚨 Error Data:", error.response?.data || error);

    res.status(error.response?.status || 500).json({
      success: false,
      message: "❌ Failed to send order to Steadfast",
      error: error.response?.data || error.message,
    });
  }
});

// ✅ Delete (Cancel) order from Steadfast Courier
router.post("/api/delete-steadfast-order", async (req, res) => {
  try {
    const { invoice, trackingId } = req.body;

    if (!invoice && !trackingId) {
      return res.status(400).json({
        success: false,
        message: "Invoice or Tracking ID required!",
      });
    }

    const headers = {
      "Api-Key": process.env.STEADFAST_API_KEY,
      "Secret-Key": process.env.STEADFAST_SECRET_KEY,
      "Content-Type": "application/json",
    };

    // 🧠 Cancel order on Steadfast
    const payload = {
      consignment_id: invoice,
      tracking_code: trackingId,
      reason: "Customer cancelled from admin panel",
    };

    const response = await axios.post(
      `${process.env.STEADFAST_BASE_URL}/create_return_request`,
      payload,
      { headers }
    );

    console.log("🗑 Steadfast Order Cancel Response:", response.data);

    // 🧩 Update local database status
    await Order.findByIdAndUpdate(invoice, { status: "cancelled" });

    res.json({
      success: true,
      message: "✅ Order cancelled successfully from Steadfast!",
      steadfastResponse: response.data,
    });
  } catch (error) {
    console.error("🚨 Delete from Steadfast Error:", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Failed to delete order from Steadfast",
      error: error.response?.data || error.message,
    });
  }
});


export default router;
