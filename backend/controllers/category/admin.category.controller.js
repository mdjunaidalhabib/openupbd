import Category from "../../src/models/Category.js";
import { deleteFromCloudinary } from "../../utils/cloudinary/cloudinaryHelpers.js";
import cloudinary from "../../utils/cloudinary/cloudinary.js";
import fs from "fs";
import sharp from "sharp";
import { toBool, normalizeCategoryOrders } from "../../utils/category/index.js";

/**
 * ✅ CATEGORY IMAGE RULE (SERVER-SIDE ENFORCE)
 * - WEBP only
 * - 300×300
 * - max 20KB
 */
const CATEGORY_IMAGE_RULE = {
  mime: "image/webp",
  width: 300,
  height: 300,
  maxBytes: 20 * 1024,
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {}
};

/**
 * ✅ validate category image file (server-side)
 * returns "" if ok else message
 */
const validateCategoryImageFile = async (file) => {
  if (!file) return "";

  // ✅ format
  if (file.mimetype !== CATEGORY_IMAGE_RULE.mime) {
    return "Only WEBP allowed (300×300, max 20KB)";
  }

  // ✅ size
  if (file.size > CATEGORY_IMAGE_RULE.maxBytes) {
    return `Max 20KB allowed (Your file: ${Math.ceil(file.size / 1024)}KB)`;
  }

  // ✅ dimension
  try {
    const meta = await sharp(file.path).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;

    if (w !== CATEGORY_IMAGE_RULE.width || h !== CATEGORY_IMAGE_RULE.height) {
      return `Must be 300×300 (Your image: ${w}×${h})`;
    }
  } catch (err) {
    console.error("Image metadata read failed:", err);
    return "Invalid image file";
  }

  return "";
};

export const createCategory = async (req, res) => {
  try {
    let imageUrl = "";
    let imagePublicId = "";

    // ✅ IMAGE UPLOAD + VALIDATION
    if (req.file) {
      const imageErr = await validateCategoryImageFile(req.file);
      if (imageErr) {
        safeUnlink(req.file.path);
        return res.status(400).json({
          error: imageErr,
          code: "INVALID_CATEGORY_IMAGE",
          rule: {
            type: "WEBP",
            width: 300,
            height: 300,
            maxKB: 20,
          },
        });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });

      safeUnlink(req.file.path);

      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    const total = await Category.countDocuments();

    let desiredOrder = Number(req.body.order || total + 1);
    if (desiredOrder < 1) desiredOrder = 1;
    if (desiredOrder > total + 1) desiredOrder = total + 1;

    const isActive =
      req.body.isActive === undefined ? true : toBool(req.body.isActive);

    // ✅ shift orders
    await Category.updateMany(
      { order: { $gte: desiredOrder } },
      { $inc: { order: 1 } }
    );

    const category = new Category({
      name,
      image: imageUrl,
      imagePublicId, // ✅ optional (if you want, otherwise ignore)
      order: desiredOrder,
      isActive,
    });

    await category.save();
    await normalizeCategoryOrders();

    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Error creating category:", err);

    // ✅ cleanup temp if any
    safeUnlink(req.file?.path);

    res.status(400).json({ error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // ✅ handle new image upload
    if (req.file) {
      const imageErr = await validateCategoryImageFile(req.file);
      if (imageErr) {
        safeUnlink(req.file.path);
        return res.status(400).json({
          error: imageErr,
          code: "INVALID_CATEGORY_IMAGE",
          rule: {
            type: "WEBP",
            width: 300,
            height: 300,
            maxKB: 20,
          },
        });
      }

      // ✅ delete old image if exists
      if (category.image) await deleteFromCloudinary(category.image);

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });

      safeUnlink(req.file.path);

      category.image = result.secure_url;
      category.imagePublicId = result.public_id; // ✅ optional
    }

    if (req.body.name) category.name = req.body.name.trim();

    if (req.body.isActive !== undefined) {
      category.isActive = toBool(req.body.isActive);
    }

    if (req.body.order !== undefined) {
      const total = await Category.countDocuments();
      let desiredOrder = Number(req.body.order || category.order);

      if (desiredOrder < 1) desiredOrder = 1;
      if (desiredOrder > total) desiredOrder = total;

      const oldOrder = category.order;

      if (desiredOrder !== oldOrder) {
        if (desiredOrder > oldOrder) {
          await Category.updateMany(
            { order: { $gt: oldOrder, $lte: desiredOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          await Category.updateMany(
            { order: { $gte: desiredOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        }

        category.order = desiredOrder;
      }
    }

    await category.save();
    await normalizeCategoryOrders();

    res.json(category);
  } catch (err) {
    console.error("❌ Error updating category:", err);

    // ✅ cleanup temp if any
    safeUnlink(req.file?.path);

    res.status(400).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const deletedOrder = category.order;

    if (category.image)
      await deleteFromCloudinary(category.image, "categories");

    await category.deleteOne();

    await Category.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    await normalizeCategoryOrders();

    res.json({
      message: "🗑️ Category deleted successfully (serial updated)",
    });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error("❌ Admin getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCategoryByIdAdmin = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json(category);
  } catch (err) {
    console.error("❌ Admin getCategoryById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
