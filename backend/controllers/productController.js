import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";

// =================== ORDER HELPERS ===================
const shiftOrdersForInsert = async (newOrder, excludeId = null) => {
  const filter = excludeId
    ? { _id: { $ne: excludeId }, order: { $gte: newOrder } }
    : { order: { $gte: newOrder } };
  await Product.updateMany(filter, { $inc: { order: 1 } });
};

const normalizeOrders = async () => {
  const items = await Product.find().sort({ order: 1, createdAt: 1 });
  for (let i = 0; i < items.length; i++) {
    const expected = i + 1;
    if (items[i].order !== expected) {
      items[i].order = expected;
      await items[i].save();
    }
  }
};

// =================== CREATE PRODUCT ===================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      colors,
    } = req.body;

    if (!name || !price || !category)
      return res.status(400).json({ error: "Name, Price & Category required" });

    const total = await Product.countDocuments();
    const serial = Number(order) > 0 ? Number(order) : total + 1;
    await shiftOrdersForInsert(serial);

    let parsedColors = colors ? JSON.parse(colors) : [];
    const hasVariants = parsedColors.length > 0;
    let primaryImage = "";
    let galleryImages = [];

    // upload.any() এর কারণে req.files থেকে ডাটা খুঁজে বের করা
    const allFiles = req.files || [];

    if (!hasVariants) {
      // ১. মেইন ইমেজ ফিল্টার
      const mainImgFile = allFiles.find((f) => f.fieldname === "image");
      if (mainImgFile) {
        const uploaded = await cloudinary.uploader.upload(mainImgFile.path, {
          folder: "products",
        });
        fs.unlinkSync(mainImgFile.path);
        primaryImage = uploaded.secure_url;
      }

      // ২. গ্যালারি ইমেজ ফিল্টার
      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");
      for (let file of galleryFiles) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery",
        });
        fs.unlinkSync(file.path);
        galleryImages.push(uploaded.secure_url);
      }
    } else {
      // ৩. কালার ভেরিয়েন্ট ইমেজ ফিল্টার
      for (let i = 0; i < parsedColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await cloudinary.uploader.upload(file.path, {
              folder: "products/variants",
            });
            fs.unlinkSync(file.path);
            urls.push(uploaded.secure_url);
          }
          parsedColors[i].images = urls;
        }
      }
    }

    const product = new Product({
      name,
      price: Number(price),
      oldPrice: Number(oldPrice),
      stock: Number(stock),
      sold: Number(sold),
      isSoldOut: isSoldOut === "true" || Number(stock) <= 0,
      rating: Number(rating),
      description,
      additionalInfo,
      category,
      image: primaryImage,
      images: galleryImages,
      colors: parsedColors,
      reviews: req.body.reviews ? JSON.parse(req.body.reviews) : [],
      order: serial,
      isActive: isActive === "true",
    });

    await product.save();
    await normalizeOrders();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================== UPDATE PRODUCT ===================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      existingImages,
      removedImages,
      colors,
      existingMainImage,
    } = req.body;

    const newOrder = Number(order);
    if (newOrder > 0 && newOrder !== product.order) {
      await shiftOrdersForInsert(newOrder, product._id);
      product.order = newOrder;
    }

    let incomingColors = colors ? JSON.parse(colors) : [];
    const hasVariants = incomingColors.length > 0;
    const allFiles = req.files || [];

    if (hasVariants) {
      // ভেরিয়েন্ট থাকলে পুরনো মেইন ইমেজ ডিলিট
      if (product.image) await deleteFromCloudinary(product.image, "products");
      for (let url of product.images)
        await deleteFromCloudinary(url, "products/gallery");

      product.image = "";
      product.images = [];

      for (let i = 0; i < incomingColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          // নতুন ফাইল থাকলে পুরনো ভেরিয়েন্ট ইমেজ ডিলিট (ঐচ্ছিক, আপনার লজিক অনুযায়ী)
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await cloudinary.uploader.upload(file.path, {
              folder: "products/variants",
            });
            fs.unlinkSync(file.path);
            urls.push(uploaded.secure_url);
          }
          incomingColors[i].images = [
            ...(incomingColors[i].images || []),
            ...urls,
          ];
        }
      }
      product.colors = incomingColors;
    } else {
      // ভেরিয়েন্ট না থাকলে ভেরিয়েন্ট ইমেজ ডিলিট
      if (product.colors.length > 0) {
        for (let color of product.colors) {
          for (let url of color.images)
            await deleteFromCloudinary(url, "products/variants");
        }
        product.colors = [];
      }

      // ১. মেইন ইমেজ আপডেট
      const mainImgFile = allFiles.find((f) => f.fieldname === "image");
      if (mainImgFile) {
        if (product.image)
          await deleteFromCloudinary(product.image, "products");
        const uploaded = await cloudinary.uploader.upload(mainImgFile.path, {
          folder: "products",
        });
        fs.unlinkSync(mainImgFile.path);
        product.image = uploaded.secure_url;
      } else {
        product.image = existingMainImage || product.image;
      }

      // ২. গ্যালারি ইমেজ আপডেট
      let keepImages = existingImages
        ? JSON.parse(existingImages)
        : product.images;
      let toRemove = removedImages ? JSON.parse(removedImages) : [];
      for (let url of toRemove)
        await deleteFromCloudinary(url, "products/gallery");

      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");
      let newGallery = [];
      for (let file of galleryFiles) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery",
        });
        fs.unlinkSync(file.path);
        newGallery.push(uploaded.secure_url);
      }
      product.images = [...keepImages, ...newGallery];
    }

    // বাকি ফিল্ড আপডেট
    if (req.body.reviews) product.reviews = JSON.parse(req.body.reviews);
    product.name = name || product.name;
    product.price = price !== undefined ? Number(price) : product.price;
    product.oldPrice =
      oldPrice !== undefined ? Number(oldPrice) : product.oldPrice;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.sold = sold !== undefined ? Number(sold) : product.sold;
    product.isSoldOut =
      isSoldOut !== undefined ? isSoldOut === "true" : product.stock <= 0;
    product.rating = rating !== undefined ? Number(rating) : product.rating;
    product.description = description ?? product.description;
    product.additionalInfo = additionalInfo ?? product.additionalInfo;
    product.category = category || product.category;
    product.isActive =
      isActive !== undefined ? isActive === "true" : product.isActive;

    await product.save();
    await normalizeOrders();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================== DELETE PRODUCT ===================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) await deleteFromCloudinary(product.image, "products");
    for (let url of product.images)
      await deleteFromCloudinary(url, "products/gallery");
    for (let color of product.colors) {
      for (let url of color.images)
        await deleteFromCloudinary(url, "products/variants");
    }

    await product.deleteOne();
    await normalizeOrders();
    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// =================== GET APIs ===================
export const getProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getProductsPublic = async (req, res) => {
  try {
    const activeCats = await Category.find({ isActive: true }).select("_id");
    const products = await Product.find({
      category: { $in: activeCats.map((c) => c._id) },
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getProductByIdPublic = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (
      !product ||
      !product.isActive ||
      (product.category && !product.category.isActive)
    )
      return res.status(403).json({ error: "Hidden" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getProductsByCategoryPublic = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category || !category.isActive)
      return res.status(403).json({ error: "Hidden" });
    const products = await Product.find({
      category: category._id,
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
