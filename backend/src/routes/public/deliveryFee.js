import express from "express";
import DeliveryFee from "../../models/DeliveryFee.js";

const router = express.Router();

// ✅ Public Read (Checkout ব্যবহার করবে)
router.get("/", async (req, res) => {
  try {
    let data = await DeliveryFee.findOne();

    // যদি DB তে না থাকে, auto create
    if (!data) data = await DeliveryFee.create({ fee: 120 });

    res.json({ fee: data.fee });
  } catch (err) {
    res.status(500).json({ error: "Failed to load delivery fee" });
  }
});

export default router;
