"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";

export default function CategoryTabsSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [error, setError] = useState(false);

  /* ================= DRAG SCROLL STATE ================= */
  const scrollRef = useRef(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef(null);

  /* ================= DATA FETCH ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [pRes, cRes] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
      ]);

      let pArr = Array.isArray(pRes) ? pRes : [];
      let cArr = Array.isArray(cRes) ? cRes : [];

      cArr = cArr.filter((c) => c.isActive !== false);
      cArr.sort((a, b) => (a.order || 0) - (b.order || 0));

      setProducts(pArr);
      setCategories(cArr);

      if (activeCat && !cArr.find((c) => String(c._id) === String(activeCat))) {
        setActiveCat(null);
      }

      setLoading(false);
    } catch (err) {
      console.log("Error fetching data:", err);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= FILTER PRODUCTS ================= */
  const filtered = useMemo(() => {
    if (!activeCat) return products;
    return products.filter(
      (p) => String(p.category?._id) === String(activeCat)
    );
  }, [activeCat, products]);

  const shouldShowSkeleton =
    loading || (!error && (products.length === 0 || categories.length === 0));

  /* ================= DRAG LOGIC ================= */
  const startInertia = () => {
    const el = scrollRef.current;
    if (!el) return;

    const step = () => {
      velocityRef.current *= 0.95;
      if (Math.abs(velocityRef.current) < 0.5) return;

      el.scrollLeft -= velocityRef.current;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const onMouseDown = (e) => {
    if (window.innerWidth < 640) return;

    isDownRef.current = true;
    scrollRef.current.classList.add("cursor-grabbing");

    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    velocityRef.current = 0;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const onMouseMove = (e) => {
    if (!isDownRef.current) return;

    e.preventDefault();
    const dx = e.pageX - startXRef.current;
    const walk = dx * 1.1;

    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    velocityRef.current = walk;
  };

  const stopDrag = () => {
    if (!isDownRef.current) return;
    isDownRef.current = false;
    scrollRef.current.classList.remove("cursor-grabbing");
    startInertia();
  };

  /* ================= ERROR UI ================= */
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-500 text-sm mb-4 text-center">
          ডেটা লোড করা যায়নি। ইন্টারনেট বা সার্ভার সমস্যা হতে পারে।
        </p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-md text-sm font-medium
            bg-gradient-to-r from-blue-600 to-purple-600
            text-white hover:opacity-90 transition"
        >
          🔄 আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  /* ================= SKELETON ================= */
  if (shouldShowSkeleton) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 py-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
        <p className="col-span-full text-center text-sm text-gray-500 mt-4">
          ডেটা লোড হচ্ছে...
        </p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
        <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          🛍️ Categories
        </span>
      </h2>

      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className="
          px-1 mb-8 w-full
          overflow-x-auto overflow-y-hidden
          [&::-webkit-scrollbar]:hidden scrollbar-none
          sm:cursor-grab
          select-none
        "
      >
        <div className="grid grid-rows-2 grid-flow-col gap-3 auto-cols-[6rem] sm:flex sm:flex-nowrap sm:gap-3 sm:min-w-max">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() =>
                setActiveCat((prev) => (prev === cat._id ? null : cat._id))
              }
              className={`flex-none flex flex-col items-center justify-center
                w-24 h-24 p-2 rounded-xl transition-all duration-300
                border shadow-sm hover:shadow-md
                ${
                  activeCat === cat._id
                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-600 scale-105"
                    : "bg-pink-100 hover:bg-pink-200 border-pink-300"
                }`}
            >
              <div className="overflow-hidden rounded-full border border-gray-300 mb-1">
                <img
                  src={cat.image || "/no-image.png"}
                  alt={cat.name}
                  className="w-10 h-10 object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <span className="text-xs font-medium text-center line-clamp-2">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 text-transparent bg-clip-text">
          {activeCat ? "📦 Selected Category Products" : "📦 All Products"}
        </span>
      </h2>

      {filtered.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {filtered.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">
          কোনো প্রোডাক্ট পাওয়া যায়নি।
        </p>
      )}
    </motion.section>
  );
}
