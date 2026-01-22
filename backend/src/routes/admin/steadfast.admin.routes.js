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
      return res.status(400).json({
        ok: false,
        requestId,
        error: "invoice, name, phone, address, cod_amount are required",
      });
    }

    /* ---------- LOAD ORDER ---------- */
    const order = await Order.findById(invoice);
    if (!order) {
      return res.status(404).json({
        ok: false,
        requestId,
        error: "Order not found",
      });
    }

    /* ---------- LOAD COURIER (KEYS FROM DB) ---------- */
    const courier = await getActiveCourier("steadfast");

    /* ---------- LOAD BASE URL FROM ENV ---------- */
    const baseUrl = process.env.STEADFAST_BASE_URL;

    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
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
      invoice: String(order._id), // reference string
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: address,
      cod_amount: Number(cod_amount),
      delivery_type: 0,
      note: note || "",
      item_description: item_description || "",
    };

    console.log("📦 STEADFAST SEND", { requestId, url, payload });

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

    // 🔥 LOG everything for debugging
    console.log("📨 STEADFAST RESPONSE", {
      requestId,
      httpStatus: resp.status,
      contentType,
      raw: raw?.slice(0, 500), // keep console clean
    });

    // Try JSON parse (even if content-type is wrong)
    const parsed = safeJsonParse(raw);
    const data = parsed.ok ? parsed.data : null;

    // ✅ If HTTP error OR API indicates error
    const apiStatus = data?.status; // many APIs use {status: 200}
    const apiOk = apiStatus === undefined ? true : apiStatus === 200;

    if (!resp.ok || !apiOk) {
      return res.status(502).json({
        ok: false,
        requestId,
        error: data?.message || "Steadfast API error (or non-OK HTTP)",
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
       ✅ UPDATE ORDER STATUS
    ====================================================== */
    order.status = "send_to_courier";
    order.trackingId =
      data?.consignment?.tracking_code || data?.tracking_code || "";
    await order.save();

    /* ---------- SUCCESS ---------- */
    return res.json({
      ok: true,
      requestId,
      message: "Courier order created & status updated",
      trackingCode: order.trackingId,
      courierResponse: data,
      order,
    });
  } catch (err) {
    console.error("🚨 COURIER ERROR:", { requestId, err });

    if (err?.code === "COURIER_NOT_CONFIGURED") {
      return res.status(400).json({ ok: false, requestId, error: err.message });
    }
    if (err?.code === "COURIER_KEYS_MISSING") {
      return res.status(400).json({ ok: false, requestId, error: err.message });
    }

    return res.status(500).json({
      ok: false,
      requestId,
      error: err.message || "Courier service error",
    });
  }
});

export default router;
