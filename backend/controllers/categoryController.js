import Category from "../src/models/Category.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

// helper: string/boolean -> boolean
const toBool = (v) => v === true || v === "true" || v === "active";

// normalize sequence to 1..n (safety for legacy duplicates)
const normalizeOrders = async () => {
  const items = await Category.find().sort({ order: 1, createdAt: 1 });

  for (let i = 0; i < items.length; i++) {
    const expected = i + 1;
    if (items[i].order !== expected) {
      items[i].order = expected;
      await items[i].save();
    }
  }
};

// ======================================================
// =================== ADMIN APIs =======================
// ======================================================

// =================== CREATE CATEGORY (ADMIN) ===================
export const createCategory = async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      fs.unlinkSync(req.file.path);
      imageUrl = result.secure_url;
    }

    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    const total = await Category.countDocuments();

    // ✅ order decide (if not sent => last)
    let desiredOrder = Number(req.body.order || total + 1);
    if (desiredOrder < 1) desiredOrder = 1;
    if (desiredOrder > total + 1) desiredOrder = total + 1;

    // ✅ IMPORTANT FIX: default true if not sent
    const isActive =
      req.body.isActive === undefined ? true : toBool(req.body.isActive);

    // ✅ shift others down from desiredOrder
    await Category.updateMany(
      { order: { $gte: desiredOrder } },
      { $inc: { order: 1 } }
    );

    const category = new Category({
      name,
      image: imageUrl,
      order: desiredOrder,
      isActive,
    });

    await category.save();
    await normalizeOrders();

    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Error creating category:", err);
    res.status(400).json({ error: err.message });
  }
};

// =================== UPDATE CATEGORY (ADMIN) ===================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // ✅ image update
    if (req.file) {
      if (category.image) await deleteFromCloudinary(category.image);

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      fs.unlinkSync(req.file.path);

      category.image = result.secure_url;
    }

    // ✅ name
    if (req.body.name) category.name = req.body.name.trim();

    // ✅ isActive update
    if (req.body.isActive !== undefined) {
      category.isActive = toBool(req.body.isActive);
    }

    // ✅ serial reorder if order changed
    if (req.body.order !== undefined) {
      const total = await Category.countDocuments();
      let desiredOrder = Number(req.body.order || category.order);

      if (desiredOrder < 1) desiredOrder = 1;
      if (desiredOrder > total) desiredOrder = total;

      const oldOrder = category.order;

      if (desiredOrder !== oldOrder) {
        if (desiredOrder > oldOrder) {
          // move down => others up
          await Category.updateMany(
            { order: { $gt: oldOrder, $lte: desiredOrder } },
            { $inc: { order: -1 } }
          );
        } else {
          // move up => others down
          await Category.updateMany(
            { order: { $gte: desiredOrder, $lt: oldOrder } },
            { $inc: { order: 1 } }
          );
        }

        category.order = desiredOrder;
      }
    }

    await category.save();
    await normalizeOrders();

    res.json(category);
  } catch (err) {
    console.error("❌ Error updating category:", err);
    res.status(400).json({ error: err.message });
  }
};

// =================== DELETE CATEGORY (ADMIN) ===================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const deletedOrder = category.order;

    if (category.image)
      await deleteFromCloudinary(category.image, "categories");

    await category.deleteOne();

    // ✅ gap fill after delete
    await Category.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    await normalizeOrders();

    res.json({
      message: "🗑️ Category deleted successfully (serial updated)",
    });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Admin: all categories (active + hidden)
export const getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error("❌ Admin getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Admin: single category (even hidden)
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

// ======================================================
// =================== PUBLIC APIs ======================
// ======================================================

// ✅ Public: only active categories (serial wise)
export const getCategoriesPublic = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(categories);
  } catch (err) {
    console.error("❌ Public getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Public: single category (hidden হলে block)
export const getCategoryByIdPublic = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category.isActive === false) {
      return res.status(403).json({ error: "Category is hidden" });
    }

    res.json(category);
  } catch (err) {
    console.error("❌ Public getCategoryById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
