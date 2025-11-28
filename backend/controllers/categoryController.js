import Category from "../src/models/Category.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

// =================== CREATE CATEGORY ===================
export const createCategory = async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "categories" });
      fs.unlinkSync(req.file.path);
      imageUrl = result.secure_url;
    }

    const category = new Category({ name: req.body.name, image: imageUrl });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Error creating category:", err);
    res.status(400).json({ error: err.message });
  }
};

// =================== UPDATE CATEGORY ===================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (req.file) {
      // পুরনো ছবি ডিলিট করো
      if (category.image) await deleteFromCloudinary(category.image);

      const result = await cloudinary.uploader.upload(req.file.path, { folder: "categories" });
      fs.unlinkSync(req.file.path);
      category.image = result.secure_url;
    }

    category.name = req.body.name || category.name;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("❌ Error updating category:", err);
    res.status(400).json({ error: err.message });
  }
};

// =================== DELETE CATEGORY ===================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // যদি ছবি থাকে, তাহলে Cloudinary থেকে মুছে ফেলো (ছবি + ফোল্ডার)
    if (category.image) await deleteFromCloudinary(category.image, "categories");

    // ডাটাবেজ থেকে ডিলিট
    await category.deleteOne();

    res.json({ message: "🗑️ Category deleted successfully (and folder if empty)" });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(400).json({ error: err.message });
  }
};

// =================== GET ALL CATEGORIES ===================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================== GET SINGLE CATEGORY ===================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("❌ Error fetching category:", err);
    res.status(500).json({ error: "Server error" });
  }
};
