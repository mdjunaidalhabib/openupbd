import express from "express";
import Slider from "../../models/Slider.js";
import upload from "../../../utils/upload.js"; // multer
import fs from "fs";
import cloudinary from "../../../utils/cloudinary.js";
import { deleteByPublicId } from "../../../utils/cloudinaryHelpers.js";

const router = express.Router();

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
 * ✅ POST create/update slide (admin)
 * - auto shift order to avoid duplicates
 * - upload/remove image
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let data = { ...req.body };

    // slide JSON parse
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
      if (slide?.srcPublicId) {
        await deleteByPublicId(slide.srcPublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "slider_images",
      });

      fs.unlinkSync(req.file.path);

      slidePayload.src = result.secure_url;
      slidePayload.srcPublicId = result.public_id;
    } else if (slide) {
      // file na thakle old src keep
      slidePayload.src = slidePayload.src || slide.src;
      slidePayload.srcPublicId = slidePayload.srcPublicId || slide.srcPublicId;
    }

    // =========================================================
    // ✅ AUTO SHIFT SERIAL / ORDER LOGIC (NO DUPLICATE)
    // =========================================================
    if (!slide) {
      // ✅ CREATE flow
      await Slider.updateMany(
        { order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );

      slide = await Slider.create(slidePayload);
    } else {
      // ✅ UPDATE flow
      if (oldOrder !== newOrder) {
        if (newOrder > oldOrder) {
          // oldOrder < order <= newOrder => -1
          await Slider.updateMany(
            { order: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          // newOrder <= order < oldOrder => +1
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

    const slides = await Slider.find().sort({ order: 1 });
    res.json({ message: "✅ Slide saved", slide, slides });
  } catch (err) {
    console.error("❌ Error saving slide:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ DELETE ALL slides (admin)
 * - delete all cloudinary images
 * - clear collection
 *
 * NOTE: MUST be above "/:id"
 */
router.delete("/delete-all", async (req, res) => {
  try {
    const allSlides = await Slider.find();

    for (const s of allSlides) {
      if (s.srcPublicId) {
        await deleteByPublicId(s.srcPublicId);
      }
    }

    await Slider.deleteMany({});

    res.json({ message: "✅ All slides deleted" });
  } catch (err) {
    console.error("❌ Delete all error:", err);
    res.status(500).json({ message: "Failed to delete all slides" });
  }
});

/**
 * ✅ DELETE single slide
 */
router.delete("/:id", async (req, res) => {
  try {
    const slide = await Slider.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });

    if (slide.srcPublicId) await deleteByPublicId(slide.srcPublicId);

    await slide.deleteOne();

    // ✅ delete পর order gap fill করতে চাইলে optional:
    // await Slider.updateMany({ order: { $gt: slide.order } }, { $inc: { order: -1 } });

    res.json({ message: "✅ Slide deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

/**
 * ✅ TOGGLE active/hidden
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
 * ✅ Reorder (bulk update)
 */
router.patch("/reorder", async (req, res) => {
  try {
    const { orders = [] } = req.body;

    const ops = orders.map((o) => ({
      updateOne: {
        filter: { _id: o.id },
        update: { $set: { order: o.order } },
      },
    }));

    if (ops.length) await Slider.bulkWrite(ops);

    res.json({ message: "✅ Reordered" });
  } catch (err) {
    res.status(500).json({ message: "Reorder failed" });
  }
});

export default router;
