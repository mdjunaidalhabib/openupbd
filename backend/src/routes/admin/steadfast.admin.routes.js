import express from "express";
import CourierSetting from "../../models/CourierSetting.js";
import Order from "../../models/Order.js";

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

  if (!setting.apiKey || !setting.secretKey) {
    const err = new Error("Courier apiKey/secretKey missing in DB");
    err.code = "COURIER_KEYS_MISSING";
    throw err;
  }

  console.log("✅ Active courier found:", setting.courier);
  return setting;
}

/* ======================================================
   🧰 Helper: Safe parse JSON
====================================================== */
function safeJsonParse(raw) {
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/* ======================================================
   🚚 SINGLE ORDER → Steadfast
   POST /admin/api/send-order
====================================================== */
router.post("/send-order", async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  console.log("📥 STEADFAST SEND ORDER HIT, requestId:", requestId);

  try {
    const {
      invoice, // orderId (Mongo _id)
      name,
      phone,
      address,
      cod_amount,
      note,
      item_description,
    } = req.body || {};

    /* ---------- VALIDATION ---------- */
    if (!invoice || !name || !phone || !address || cod_amount === undefined) {
      console.log("❌ Validation failed:", req.body);
      return res.status(400).json({
        ok: false,
        requestId,
        error: "invoice, name, phone, address, cod_amount are required",
      });
    }

    /* ---------- LOAD ORDER ---------- */
    const order = await Order.findById(invoice);
    if (!order) {
      console.log("❌ Order not found:", invoice);
      return res.status(404).json({
        ok: false,
        requestId,
        error: "Order not found",
      });
    }
    console.log("✅ Order loaded:", order._id);

    /* ---------- LOAD COURIER (KEYS FROM DB) ---------- */
    const courier = await getActiveCourier("steadfast");

    /* ---------- LOAD BASE URL FROM ENV ---------- */
    const baseUrl = process.env.STEADFAST_BASE_URL;
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      console.log("❌ STEADFAST_BASE_URL missing or invalid:", baseUrl);
      return res.status(500).json({
        ok: false,
        requestId,
        error:
          "STEADFAST_BASE_URL env is missing or invalid (must start with http/https)",
        envValue: baseUrl || null,
      });
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/create_order`;

    /* ---------- STEADFAST PAYLOAD ---------- */
    const payload = {
      invoice: String(order._id),
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: Number(cod_amount),
      delivery_type: 0,
      note: note || "",
      item_description: item_description || "",
    };

    console.log("📦 STEADFAST SEND PAYLOAD:", { requestId, url, payload });

    /* ---------- STEADFAST API CALL ---------- */
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": courier.apiKey,
        "Secret-Key": courier.secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = resp.headers.get("content-type") || "";
    const raw = await resp.text();

    console.log("📨 STEADFAST RESPONSE RAW:", raw?.slice(0, 500));

    const parsed = safeJsonParse(raw);
    const data = parsed.ok ? parsed.data : null;

    const apiStatus = data?.status;
    const apiOk = apiStatus === undefined ? true : apiStatus === 200;

    if (!resp.ok || !apiOk) {
      console.log("❌ STEADFAST API ERROR:", data);
      return res.status(502).json({
        ok: false,
        requestId,
        error: data?.message || "Steadfast API error",
        steadfast: {
          url,
          httpStatus: resp.status,
          contentType,
          rawResponse: raw,
          parsed: data,
        },
      });
    }

    /* ======================================================
       ✅ UPDATE ORDER
    ====================================================== */
    order.status = "send_to_courier";

    order.courier = {
      provider: "steadfast",
      trackingId: data?.consignment?.tracking_code || "",
      consignmentId: data?.consignment?.consignment_id || null,
      status: data?.consignment?.status || "in_review",
      rawResponse: data,
      sentAt: new Date(),
    };

    // legacy field sync
    order.trackingId = order.courier.trackingId;

    await order.save();
    console.log("✅ Order updated with courier info:", order._id);

    return res.json({
      ok: true,
      requestId,
      message: "Courier order created & status updated",
      trackingCode: order.courier.trackingId,
      courierResponse: data,
      order,
    });
  } catch (err) {
    console.error("🚨 COURIER ERROR:", err);
    return res.status(500).json({
      ok: false,
      requestId,
      error: err.message || "Courier service error",
    });
  }
});

export default router;
