import express from "express";
import CourierSetting from "../models/CourierSetting.js";
const router = express.Router();

// Get all courier settings
router.get("/api/courier-settings", async (req, res) => {
  const list = await CourierSetting.find();
  res.json(list);
});

// Add or update courier
router.post("/api/courier-settings", async (req, res) => {
  const { courier, merchantName, apiKey, secretKey, baseUrl } = req.body;
  const existing = await CourierSetting.findOne({ courier });
  if (existing) {
    await CourierSetting.updateOne(
      { courier },
      { merchantName, apiKey, secretKey, baseUrl }
    );
    res.json({ message: "✅ Courier updated successfully!" });
  } else {
    await CourierSetting.create(req.body);
    res.json({ message: "✅ Courier added successfully!" });
  }
});

// Set active courier
router.post("/api/set-active-courier", async (req, res) => {
  const { courier } = req.body;
  await CourierSetting.updateMany({}, { isActive: false });
  await CourierSetting.findOneAndUpdate({ courier }, { isActive: true });
  res.json({ message: `${courier} is now active!` });
});

export default router;
