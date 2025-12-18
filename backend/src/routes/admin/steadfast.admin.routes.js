import express from "express";
import CourierSetting from "../../models/CourierSetting.js";
import Order from "../../models/Order.js"; // ✅ ADD

const router = express.Router();

/* ======================================================
   🪵 DEBUG LOGGER
====================================================== */
router.use((req, res, next) => {
  console.log("🚚 STEADFAST ROUTE HIT:", req.method, req.originalUrl);
  next();
});

/* ======================================================
   🔑 Helper: Get active courier config
====================================================== */
async function getActiveCourier(courier = "steadfast") {
  const setting = await CourierSetting.findOne({
    courier,
    isActive: true,
  }).lean();

  if (!setting) {
    const err = new Error("Courier setting not found or inactive");
    err.code = "COURIER_NOT_CONFIGURED";
    throw err;
  }

  return setting;
}

/* ======================================================
   🚚 SINGLE ORDER → Steadfast
   POST /admin/api/send-order
====================================================== */
router.post("/send-order", async (req, res) => {
  try {
    const {
      invoice, // orderId
      name,
      phone,
      address,
      cod_amount,
      note,
      item_description,
    } = req.body || {};

    /* ---------- VALIDATION ---------- */
    if (!invoice || !name || !phone || !address || cod_amount === undefined) {
      return res.status(400).json({
        error: "invoice, name, phone, address, cod_amount are required",
      });
    }

    /* ---------- LOAD ORDER ---------- */
    const order = await Order.findById(invoice);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    /* ---------- LOAD COURIER ---------- */
    const courier = await getActiveCourier("steadfast");

    if (!courier.baseUrl || !/^https?:\/\//i.test(courier.baseUrl)) {
      return res.status(500).json({
        error: "Courier service URL invalid",
      });
    }

    /* ---------- STEADFAST PAYLOAD ---------- */
    const payload = {
      invoice: String(invoice),
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: Number(cod_amount),
      delivery_type: 0,
      note: note || "",
      item_description: item_description || "",
    };

    /* ---------- STEADFAST API CALL ---------- */
    const resp = await fetch(`${courier.baseUrl}/create_order`, {
      method: "POST",
      headers: {
        "Api-Key": courier.apiKey,
        "Secret-Key": courier.secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || data?.status !== 200) {
      return res.status(502).json({
        error: data?.message || "Steadfast API error",
        details: data,
      });
    }

    /* ======================================================
       ✅ UPDATE ORDER STATUS HERE (IMPORTANT FIX)
    ====================================================== */
    order.status = "send_to_courier";
    order.trackingId = data?.consignment?.tracking_code || "";
    await order.save();

    /* ---------- SUCCESS ---------- */
    return res.json({
      ok: true,
      message: "Courier order created & status updated",
      trackingCode: order.trackingId,
      order,
    });
  } catch (err) {
    console.error("🚨 COURIER ERROR:", err);

    return res.status(500).json({
      error: err.message || "Courier service error",
    });
  }
});

export default router;
