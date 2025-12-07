import express from "express";
import Slider from "../../models/Slider.js";
import upload from "../../../utils/upload.js";
import fs from "fs";
import cloudinary from "../../../utils/cloudinary.js";
import { deleteByPublicId } from "../../../utils/cloudinaryHelpers.js";

const router = express.Router();

/**
 * ✅ helper: normalize serial/order to 1..n
 * (gap fill + duplicates fix)
 */
const normalizeOrders = async () => {
  const slides = await Slider.find().sort({ order: 1, createdAt: 1 });
  const ops = slides.map((s, i) => ({
    updateOne: {
      filter: { _id: s._id },
      update: { $set: { order: i + 1 } },
    },
  }));
  if (ops.length) await Slider.bulkWrite(ops);
};

/**
 * ✅ GET all slides (admin)
 * sort: order asc
 */
router.get("/", async (req, res) => {
  try {
    const slides = await Slider.find().sort({ order: 1 });
    res.json({ slides });
  } catch (err) {
    res.status(500).json({ message: "Failed to load slides" });
  }
});

/**
 * ✅ Reorder (bulk update)
 * ⚠️ MUST be before "/:id"
 * frontend payload: { reordered: [{ _id, order }] }
 */
router.patch("/reorder", async (req, res) => {
  try {
    const { reordered = [] } = req.body;

    const ops = reordered.map((o) => ({
      updateOne: {
        filter: { _id: o._id },
        update: { $set: { order: Number(o.order) } },
      },
    }));

    if (ops.length) await Slider.bulkWrite(ops);

    // ✅ reorder শেষে normalize করে দিচ্ছি
    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Reordered", slides });
  } catch (err) {
    console.error("Reorder failed:", err);
    res.status(500).json({ message: "Reorder failed" });
  }
});

/**
 * ✅ POST create/update slide (admin)
 * - auto shift order to avoid duplicates
 * - upload/remove image
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let data = { ...req.body };

    if (data.slide && typeof data.slide === "string") {
      try {
        data.slide = JSON.parse(data.slide);
      } catch {
        data.slide = {};
      }
    }

    const slidePayload = data.slide || {};
    const removeImage = data.removeImage === "true";

    let slide = null;
    let oldOrder = null;

    if (slidePayload._id) {
      slide = await Slider.findById(slidePayload._id);
      if (slide) oldOrder = slide.order ?? 1;
    }

    const newOrder = Number(slidePayload.order ?? 1);

    // ✅ removeImage request
    if (removeImage && slide?.srcPublicId) {
      await deleteByPublicId(slide.srcPublicId);
      slidePayload.src = "";
      slidePayload.srcPublicId = "";
      delete data.removeImage;
    }

    // ✅ handle new image upload
    if (req.file) {
      if (slide?.srcPublicId) await deleteByPublicId(slide.srcPublicId);

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "slider_images",
      });

      fs.unlinkSync(req.file.path);

      slidePayload.src = result.secure_url;
      slidePayload.srcPublicId = result.public_id;
    } else if (slide) {
      slidePayload.src = slidePayload.src || slide.src;
      slidePayload.srcPublicId = slidePayload.srcPublicId || slide.srcPublicId;
    }

    // =========================================================
    // ✅ AUTO SHIFT SERIAL / ORDER LOGIC (NO DUPLICATE)
    // =========================================================
    if (!slide) {
      // ✅ CREATE
      await Slider.updateMany(
        { order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );

      slide = await Slider.create(slidePayload);
    } else {
      // ✅ UPDATE
      if (oldOrder !== newOrder) {
        if (newOrder > oldOrder) {
          await Slider.updateMany(
            { order: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          await Slider.updateMany(
            { order: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        }
      }

      Object.assign(slide, slidePayload);
      slide.updatedAt = new Date();
      await slide.save();
    }

    // ✅ save/update শেষে normalize
    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Slide saved", slide, slides });
  } catch (err) {
    console.error("❌ Error saving slide:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ DELETE ALL slides (admin)
 * NOTE: MUST be above "/:id"
 */
router.delete("/delete-all", async (req, res) => {
  try {
    const allSlides = await Slider.find();

    for (const s of allSlides) {
      if (s.srcPublicId) await deleteByPublicId(s.srcPublicId);
    }

    await Slider.deleteMany({});

    res.json({ message: "✅ All slides deleted" });
  } catch (err) {
    console.error("❌ Delete all error:", err);
    res.status(500).json({ message: "Failed to delete all slides" });
  }
});

/**
 * ✅ TOGGLE active/hidden
 * NOTE: MUST be above "/:id"
 */
router.patch("/:id/toggle", async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });

    slide.isActive = !slide.isActive;
    await slide.save();

    res.json({ message: "✅ Status updated", slide });
  } catch (err) {
    res.status(500).json({ message: "Toggle failed" });
  }
});

/**
 * ✅ DELETE single slide
 * delete করলে auto order reset হবে
 */
router.delete("/:id", async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });

    if (slide.srcPublicId) await deleteByPublicId(slide.srcPublicId);

    await slide.deleteOne();

    // ✅ gap fill / normalize after delete
    await normalizeOrders();

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Slide deleted", slides });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
