import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

// ✅ FIX: correct relative path (routes/public থেকে utils)
import { getOrderMailSendSettings } from "../../../utils/order-mail-send.js";

// ✅ FIX: named import
import { sendAdminOrderEmail } from "../../../utils/sendAdminOrderEmail.js";

const router = express.Router();

/* ---------------- Helpers ---------------- */

const toNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const normalizePaymentMethod = (method) => {
  const m = String(method || "").toLowerCase();
  if (m === "paynow" || m === "bkash") return "bkash";
  return "cod";
};

const hasVariants = (product) =>
  Array.isArray(product?.colors) && product.colors.length > 0;

const computeVariantTotalStock = (colors) => {
  const list = Array.isArray(colors) ? colors : [];
  return list.reduce((sum, c) => sum + toNumber(c?.stock, 0), 0);
};

const computeSoldOut = (product) => {
  if (!hasVariants(product)) return toNumber(product?.stock, 0) <= 0;
  const anyInStock = product.colors.some((c) => toNumber(c?.stock, 0) > 0);
  return !anyInStock;
};

/**
 * ✅ Inventory update (stock & sold) for a single item
 * item: { productId, qty, color }
 * mode: "decrease" | "increase"
 */
const updateInventoryForItem = async (item, mode = "decrease") => {
  const productId = item?.productId;
  const qty = toNumber(item?.qty, 0);
  const color = item?.color ? String(item.color) : null;

  if (!productId || qty <= 0) return null;

  const product = await Product.findById(productId);
  if (!product) return null;

  const productHasVariants = hasVariants(product);

  // ✅ Variant
  if (productHasVariants && color) {
    const idx = product.colors.findIndex(
      (c) => String(c?.name) === String(color)
    );
    if (idx === -1) {
      throw new Error(
        `Variant not found: ${color} for product: ${product.name}`
      );
    }

    const currentVariantStock = toNumber(product.colors[idx]?.stock, 0);

    if (mode === "decrease") {
      if (currentVariantStock < qty) {
        throw new Error(
          `${product.name} (${color}) stock not enough. Available: ${currentVariantStock}`
        );
      }

      product.colors[idx].stock = currentVariantStock - qty;
      product.colors[idx].sold = toNumber(product.colors[idx]?.sold, 0) + qty;

      product.sold = toNumber(product.sold, 0) + qty;
    } else {
      product.colors[idx].stock = currentVariantStock + qty;

      product.colors[idx].sold = toNumber(product.colors[idx]?.sold, 0) - qty;
      if (product.colors[idx].sold < 0) product.colors[idx].sold = 0;

      product.sold = toNumber(product.sold, 0) - qty;
      if (product.sold < 0) product.sold = 0;
    }

    product.stock = computeVariantTotalStock(product.colors);
    product.isSoldOut = computeSoldOut(product);

    await product.save();
    return product;
  }

  // ✅ Normal product
  const baseStock = toNumber(product.stock, 0);

  if (mode === "decrease") {
    if (baseStock < qty) {
      throw new Error(
        `${product.name} stock not enough. Available: ${baseStock}`
      );
    }

    product.stock = baseStock - qty;
    product.sold = toNumber(product.sold, 0) + qty;

    if (product.stock <= 0) product.stock = 0;
  } else {
    product.stock = baseStock + qty;

    product.sold = toNumber(product.sold, 0) - qty;
    if (product.sold < 0) product.sold = 0;
  }

  product.isSoldOut = computeSoldOut(product);
  await product.save();
  return product;
};

/* ---------------- Routes ---------------- */

/**
 * @route   POST /api/orders
 * @desc    নতুন অর্ডার তৈরি করা এবং স্টক কমানো + সোল্ড আপডেট (Variant Wise ✅)
 *          ✅ Admin Email Notify Added (DB driven)
 */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      subtotal,
      total,
      billing,
      discount,
      promoCode,
      userId,
      paymentMethod,
      paymentStatus,
    } = req.body;

    // ✅ Validation
    if (!items?.length || subtotal == null || total == null) {
      return res.status(400).json({
        error: "প্রয়োজনীয় তথ্য প্রদান করা হয়নি (Missing fields)",
      });
    }

    if (!billing?.name || !billing?.phone || !billing?.address) {
      return res.status(400).json({
        error: "Billing তথ্য সম্পূর্ণ নয় (name/phone/address required)",
      });
    }

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    // ✅ delivery charge ALWAYS 120 (enforced)
    const DELIVERY_CHARGE = 120;

    // ✅ SAVE ORDER FIRST
    const order = new Order({
      items,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discount: toNumber(discount, 0),
      total,
      billing: {
        name: billing.name,
        phone: billing.phone,
        address: billing.address,
        note: billing.note || "",
      },
      promoCode: promoCode || "",
      userId: userId || null,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus || "pending",
      status: "pending",
    });

    const savedOrder = await order.save();

    // ✅ Inventory decrease (variant aware)
    try {
      const updates = items.map((item) =>
        updateInventoryForItem(item, "decrease")
      );
      await Promise.all(updates);
    } catch (stockErr) {
      console.error("❌ Stock/Sold Update Error:", stockErr);
      // Optional rollback if you want strict stock check
      // await Order.findByIdAndDelete(savedOrder._id);
      // return res.status(400).json({ error: stockErr.message || "Stock not available" });
    }

    // ✅ ✅ Admin Email Notify (DB settings)
    try {
      const settings = await getOrderMailSendSettings();
      const adminEmail = settings?.adminEmail?.trim();

      if (adminEmail) {
        await sendAdminOrderEmail({
          to: adminEmail,
          orderId: savedOrder._id,
          customerName: savedOrder?.billing?.name,
          customerPhone: savedOrder?.billing?.phone,
          address: savedOrder?.billing?.address,
          note: savedOrder?.billing?.note,
          items: savedOrder?.items,
          subtotal: savedOrder?.subtotal,
          deliveryCharge: savedOrder?.deliveryCharge,
          discount: savedOrder?.discount,
          total: savedOrder?.total,
          paymentMethod: savedOrder?.paymentMethod,
        });
      } else {
        console.warn("⚠️ Admin email is not set in DB (order-mail-send)");
      }
    } catch (mailErr) {
      console.error("❌ Admin Email Send Failed:", mailErr);
      // ✅ Do not fail order because mail failed
    }

    return res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(500).json({ error: "অর্ডার তৈরি করতে ব্যর্থ হয়েছে।" });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    ID দিয়ে নির্দিষ্ট অর্ডারের বিস্তারিত তথ্য দেখা
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "অর্ডারটি খুঁজে পাওয়া যায়নি।" });
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "অর্ডার আইডি সঠিক নয়।" });
    }
    return res.status(500).json({ error: "সার্ভার এরর!" });
  }
});

/**
 * @route   GET /api/orders
 * @desc    ইউজার আইডি দিয়ে সব অর্ডার লিস্ট দেখা
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId প্রয়োজন।" });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: "অর্ডার লিস্ট লোড করা সম্ভব হয়নি।" });
  }
});

/**
 * @route   PUT /api/orders/:id
 * @desc    অর্ডার ক্যানসেল বা আপডেট করা (Variant Restock ✅)
 */
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "অর্ডার পাওয়া যায়নি।" });

    const { status, cancelReason, billing, paymentStatus } = req.body;

    if (billing) {
      order.billing = {
        ...order.billing,
        name: billing.name ?? order.billing.name,
        phone: billing.phone ?? order.billing.phone,
        address: billing.address ?? order.billing.address,
        note: billing.note ?? order.billing.note,
      };
    }

    if (paymentStatus) {
      const ps = String(paymentStatus);
      if (["pending", "paid", "failed"].includes(ps)) {
        order.paymentStatus = ps;
      }
    }

    if (status === "cancelled") {
      if (order.status !== "pending") {
        return res.status(403).json({
          error: "অর্ডারটি ইতিমধ্যে প্রসেস হয়ে গেছে, ক্যানসেল করা সম্ভব নয়।",
        });
      }

      order.status = "cancelled";
      order.cancelReason = cancelReason || "Cancelled by user";

      try {
        const restocks = order.items.map((item) =>
          updateInventoryForItem(item, "increase")
        );
        await Promise.all(restocks);
      } catch (restockErr) {
        console.error("❌ Restock Error:", restockErr);
      }
    } else if (status) {
      const allowed = [
        "pending",
        "ready_to_delivery",
        "send_to_courier",
        "delivered",
        "cancelled",
      ];

      if (!allowed.includes(String(status))) {
        return res.status(400).json({ error: "Invalid status" });
      }

      order.status = status;
    }

    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "অর্ডার আপডেট ব্যর্থ হয়েছে।" });
  }
});

export default router;
