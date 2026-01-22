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
   🚚 SEND ORDER → STEADFAST
   POST /admin/api/steadfast/send-order
====================================================== */
router.post("/send-order", async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    const {
      invoice,
      name,
      phone,
      address,
      cod_amount,
      note,
      item_description,
    } = req.body || {};

    if (!invoice || !name || !phone || !address || cod_amount === undefined) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: "invoice, name, phone, address, cod_amount are required",
      });
    }

    const order = await Order.findById(invoice);
    if (!order) {
      return res
        .status(404)
        .json({ ok: false, requestId, error: "Order not found" });
    }

    const courier = await getActiveCourier("steadfast");
    const baseUrl = process.env.STEADFAST_BASE_URL;

    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return res.status(500).json({
        ok: false,
        requestId,
        error: "STEADFAST_BASE_URL missing or invalid",
      });
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/create_order`;

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

    const raw = await resp.text();
    const parsed = safeJsonParse(raw);
    const data = parsed.ok ? parsed.data : null;

    if (!resp.ok || (data?.status && data.status !== 200)) {
      return res.status(502).json({
        ok: false,
        requestId,
        error: data?.message || "Steadfast API error",
        raw,
      });
    }

    // ✅ Save CID only (consignment_id)
    const cid = data?.consignment?.consignment_id;
    order.status = "send_to_courier";
    order.trackingId = cid ? String(cid) : null;

    await order.save();

    return res.json({
      ok: true,
      requestId,
      message: "Courier order created",
      order,
      courierResponse: data,
    });
  } catch (err) {
    console.error("🚨 COURIER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Courier service error",
    });
  }
});

/* ======================================================
   📦 CHECK COURIER STATUS (STEADFAST)
   GET /admin/api/steadfast/status/:id
   - id can be CID or trackingCode
====================================================== */
router.get("/status/:id", async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ ok: false, requestId, error: "ID is required" });
    }

    const courier = await getActiveCourier("steadfast");
    const baseUrl = process.env.STEADFAST_BASE_URL;

    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return res.status(500).json({
        ok: false,
        requestId,
        error: "STEADFAST_BASE_URL missing or invalid",
      });
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");

    // ✅ First try CID endpoint
    const urlByCid = `${cleanBase}/status_by_cid/${id}`;

    const call = async (url) => {
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          "Api-Key": courier.apiKey,
          "Secret-Key": courier.secretKey,
          Accept: "application/json",
        },
      });

      const raw = await resp.text();
      const parsed = safeJsonParse(raw);
      const data = parsed.ok ? parsed.data : null;

      return { resp, raw, data };
    };

    console.log("🔎 STEADFAST STATUS CHECK (CID)", { requestId, urlByCid });

    let result = await call(urlByCid);

    // যদি CID না হয়/ফেইল করে, trackingcode দিয়ে try করবে
    if (!result.data?.delivery_status) {
      const urlByTracking = `${cleanBase}/status_by_trackingcode/${id}`;
      console.log("🔎 STEADFAST STATUS CHECK (TRACKING)", {
        requestId,
        urlByTracking,
      });
      result = await call(urlByTracking);
    }

    const delivery_status = result.data?.delivery_status;

    if (!delivery_status) {
      return res.status(502).json({
        ok: false,
        requestId,
        error: "Failed to fetch courier status",
        tried: ["status_by_cid", "status_by_trackingcode"],
        raw: result.raw,
      });
    }

    return res.json({
      ok: true,
      requestId,
      delivery_status,
      raw: result.data,
    });
  } catch (err) {
    console.error("🚨 STATUS CHECK ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Courier status error",
    });
  }
});

export default router;
