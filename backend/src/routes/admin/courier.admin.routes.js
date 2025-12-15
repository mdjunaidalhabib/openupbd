import express from "express";
import CourierSetting from "../../models/CourierSetting.js";

const router = express.Router();

/**
 * ================================
 * GET all courier settings
 * FINAL: GET /api/v1/admin/courier-settings
 * ================================
 */
router.get("/courier-settings", async (req, res) => {
  try {
    const list = await CourierSetting.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Failed to fetch courier settings:", err);
    res.status(500).json({
      error: "Failed to fetch courier settings",
      details: err.message,
    });
  }
});

/**
 * ================================
 * ADD or UPDATE courier setting
 * FINAL: POST /api/v1/admin/courier-settings
 * ================================
 */
router.post("/courier-settings", async (req, res) => {
  try {
    const { courier, merchantName, apiKey, secretKey, baseUrl } = req.body;

    if (!courier?.trim()) {
      return res.status(400).json({
        error: "Courier name is required",
      });
    }

    const existing = await CourierSetting.findOne({ courier });

    if (existing) {
      existing.merchantName = merchantName;
      existing.apiKey = apiKey;
      existing.secretKey = secretKey;
      existing.baseUrl = baseUrl;

      await existing.save();

      return res.json({
        message: "✅ Courier updated successfully!",
        courier,
      });
    }

    await CourierSetting.create({
      courier,
      merchantName,
      apiKey,
      secretKey,
      baseUrl,
      isActive: false,
    });

    res.json({
      message: "✅ Courier added successfully!",
      courier,
    });
  } catch (err) {
    console.error("❌ Failed to save courier setting:", err);
    res.status(500).json({
      error: "Failed to save courier setting",
      details: err.message,
    });
  }
});

/**
 * ================================
 * SET active courier
 * FINAL: POST /api/v1/admin/set-active-courier
 * ================================
 */
router.post("/set-active-courier", async (req, res) => {
  try {
    const { courier } = req.body;

    if (!courier?.trim()) {
      return res.status(400).json({
        error: "Courier name is required",
      });
    }

    const exists = await CourierSetting.findOne({ courier });
    if (!exists) {
      return res.status(404).json({
        error: "Courier not found",
      });
    }

    // deactivate all
    await CourierSetting.updateMany({}, { isActive: false });

    // activate selected
    await CourierSetting.updateOne({ courier }, { isActive: true });

    res.json({
      message: `✅ ${courier} is now active!`,
    });
  } catch (err) {
    console.error("❌ Failed to set active courier:", err);
    res.status(500).json({
      error: "Failed to set active courier",
      details: err.message,
    });
  }
});

export default router;
