"use client";
import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";

export default function CategoryTabsSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          apiFetch("/api/products"),
          apiFetch("/api/categories"),
        ]);
        setProducts(pRes);
        setCategories(cRes);
        setLoading(false);
      } catch (err) {
        console.log("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = activeCat
    ? products.filter((p) => String(p.category?._id) === String(activeCat))
    : products;

  if (loading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 py-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* ✅ Section Heading */}
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 relative inline-block w-full">
        <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          🛍️ Categories
        </span>
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: "60px" }}
          transition={{ duration: 0.6 }}
          className="block mx-auto mt-2 h-[2px] bg-gradient-to-r from-blue-600 to-pink-500 rounded-full"
        ></motion.span>
      </h2>

      {/* ✅ Category Buttons with Hover Zoom */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() =>
              setActiveCat((prev) => (prev === cat._id ? null : cat._id))
            }
            className={`flex flex-col items-center justify-center w-20 sm:w-24 md:w-28 p-2 rounded-xl transition-all duration-300 border shadow-sm hover:shadow-md ${
              activeCat === cat._id
                ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-600 scale-105"
                : "bg-pink-100 hover:bg-pink-200 border-pink-300"
            }`}
          >
            <div className="overflow-hidden rounded-full border border-gray-300 mb-1">
              <img
                src={cat.image || "/no-image.png"}
                alt={cat.name}
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center">
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* ✅ Product Heading */}
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 relative inline-block w-full">
        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 text-transparent bg-clip-text">
          {activeCat ? "📦 Selected Category Products" : "📦 All Products"}
        </span>
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: "60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="block mx-auto mt-2 h-[2px] bg-gradient-to-r from-pink-500 to-blue-600 rounded-full"
        ></motion.span>
      </h2>

      {/* ✅ Product Grid */}
      {filtered.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">
          এই ক্যাটাগরিতে কোনো প্রোডাক্ট পাওয়া যায়নি।
        </p>
      )}
    </motion.section>
  );
}
