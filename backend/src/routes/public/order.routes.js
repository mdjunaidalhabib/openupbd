import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    নতুন অর্ডার তৈরি করা এবং স্টক কমানো
 */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      subtotal,
      deliveryCharge,
      total,
      billing,
      discount,
      promoCode,
      userId,
      paymentMethod,
    } = req.body;

    // ভ্যালিডেশন
    if (
      !items?.length ||
      subtotal == null ||
      !billing?.name ||
      !billing?.phone
    ) {
      return res
        .status(400)
        .json({ error: "প্রয়োজনীয় তথ্য প্রদান করা হয়নি (Missing fields)" });
    }

    const order = new Order({
      items,
      subtotal,
      deliveryCharge: deliveryCharge || 0,
      discount: discount || 0,
      total,
      billing,
      promoCode: promoCode || "",
      userId: userId || null,
      paymentMethod: paymentMethod || "free",
      status: "pending",
    });

    // ১. অর্ডার সেভ করা
    const savedOrder = await order.save();

    // ২. স্টক ম্যানেজমেন্ট (Inventory update)
    try {
      const stockUpdates = items.map((item) => {
        return Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty },
        });
      });
      await Promise.all(stockUpdates);
    } catch (stockErr) {
      console.error("❌ Stock Update Error:", stockErr);
    }

    return res.status(201).json(savedOrder);
  } catch (err) {
    console.error("❌ Failed to create order:", err);
    return res.status(500).json({ error: "অর্ডার তৈরি করতে ব্যর্থ হয়েছে।" });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    ID দিয়ে নির্দিষ্ট অর্ডারের বিস্তারিত তথ্য দেখা (Order Summary)
 */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "অর্ডারটি খুঁজে পাওয়া যায়নি।" });
    }

    // ফ্রন্টএন্ড সামারির জন্য সব ডেটা রিটার্ন করা হচ্ছে
    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    // যদি আইডি ভুল ফরম্যাটে থাকে (CastError)
    if (err.kind === "ObjectId") {
      return res.status(400).json({ error: "অর্ডার আইডি সঠিক নয়।" });
    }
    return res
      .status(500)
      .json({ error: "সার্ভার এরর! অর্ডার লোড করা সম্ভব হয়নি।" });
  }
});

/**
 * @route   GET /api/orders
 * @desc    ইউজার আইডি দিয়ে সব অর্ডার লিস্ট দেখা (Order History)
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId প্রয়োজন।" });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: "অর্ডার লিস্ট লোড করা সম্ভব হয়নি।" });
  }
});

/**
 * @route   PUT /api/orders/:id
 * @desc    অর্ডার ক্যানসেল বা আপডেট করা
 */
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "অর্ডার পাওয়া যায়নি।" });

    // শুধুমাত্র পেন্ডিং অর্ডার ক্যানসেল করা যাবে
    if (order.status !== "pending" && req.body.status === "cancelled") {
      return res
        .status(403)
        .json({
          error: "অর্ডারটি ইতিমধ্যে প্রসেস হয়ে গেছে, ক্যানসেল করা সম্ভব নয়।",
        });
    }

    const { status, cancelReason, billing } = req.body;

    if (billing) order.billing = billing;

    if (status === "cancelled") {
      order.status = "cancelled";
      order.cancelReason = cancelReason || "Cancelled by user";

      // স্টক ফেরত দেওয়া
      const restockUpdates = order.items.map((item) => {
        return Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      });
      await Promise.all(restockUpdates);
    } else if (status) {
      order.status = status;
    }

    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: "অর্ডার আপডেট ব্যর্থ হয়েছে।" });
  }
});

export default router;
