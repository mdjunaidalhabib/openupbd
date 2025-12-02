"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton"; 

// ========================== Category Row ==========================
const CategoryRow = ({ category, items, autoPlayMs = 3000, delay = 0 }) => {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const [slidesPerView, setSlidesPerView] = useState(2);

  // responsive slides per view
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) return 2;
      if (w < 1024) return 3;
      return 4;
    };
    setSlidesPerView(calc());
    const resizeHandler = () => setSlidesPerView(calc());
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  // extended list for infinite loop
  const extended = useMemo(() => {
    if (!items?.length) return [];
    const minLen = items.length + slidesPerView * 2;
    const out = [];
    let i = 0;
    while (out.length < minLen) {
      out.push(items[i % items.length]);
      i++;
    }
    return out;
  }, [items, slidesPerView]);

  // autoplay with delay
  useEffect(() => {
    if (!extended.length || !autoPlayMs) return;

    let intervalId;
    const startTimeout = setTimeout(() => {
      intervalId = setInterval(() => setIndex((i) => i + 1), autoPlayMs);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(intervalId);
    };
  }, [extended.length, autoPlayMs, delay]);

  // loop back
  useEffect(() => {
    if (!extended.length) return;
    const maxSafe = items.length + slidesPerView;
    if (index > maxSafe) {
      const normalized = index % items.length;
      setEnableTransition(false);
      setIndex(normalized);
      requestAnimationFrame(() => setEnableTransition(true));
    }
  }, [index, extended.length, items.length, slidesPerView]);

  // swipe/drag handlers
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const deltaXRef = useRef(0);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
    setEnableTransition(false);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    deltaXRef.current = e.clientX - startXRef.current;
    if (e.pointerType !== "mouse") e.preventDefault();
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    const dx = deltaXRef.current;
    draggingRef.current = false;
    setEnableTransition(true);

    const el = trackRef.current;
    const width = el ? el.clientWidth : 1;
    const threshold = (width / slidesPerView) * 0.25;

    if (Math.abs(dx) >= threshold) {
      if (dx < 0) setIndex((i) => i + 1);
      else setIndex((i) => Math.max(0, i - 1));
    }
    deltaXRef.current = 0;
  };

  const basePercent = -(index * (100 / slidesPerView));
  const dragPercent =
    draggingRef.current && trackRef.current
      ? (deltaXRef.current / trackRef.current.clientWidth) * 100
      : 0;
  const transform = `translateX(calc(${basePercent}% + ${dragPercent}%))`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold">{category.name}</h2>
        <Link
          href={`/categories/${category._id}`}
          className="text-blue-600 hover:underline text-sm sm:text-base"
        >
          View all
        </Link>
      </div>

      {/* Slider */}
      <div className="relative overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-full select-none touch-pan-y"
          style={{
            transform,
            transition: enableTransition ? "transform 450ms ease" : "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {extended.length
            ? extended.map((prod, i) => (
                <div
                  key={`${prod._id || prod.id}-${i}`}
                  className="shrink-0 px-2"
                  style={{ width: `${100 / slidesPerView}%` }}
                >
                  <ProductCard product={prod} />
                </div>
              ))
            : Array.from({ length: slidesPerView * 2 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 px-2"
                  style={{ width: `${100 / slidesPerView}%` }}
                >
                  <ProductCardSkeleton /> {/* ✅ use external skeleton */}
                </div>
              ))}
        </div>
      </div>
    </motion.section>
  );
};

// ========================== Main Component ==========================
export default function HomeCategorySections() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const speedByCategoryId = {
    "68d2645569c371024fb0f519": 4000,
    "68d2a92d28415e4dc80bc4d2": 5000,
  };

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
        console.log("Error fetching categories:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

if (loading)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 py-10">
      {Array.from({ length: 8 }).map((_, i) => (
        // ✅ page-level skeletons
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );


  return (
    <div className="space-y-10">
      {categories.map((cat, idx) => {
        const items = products.filter(
          (p) => String(p.category?._id) === String(cat._id)
        );
        if (!items.length) return null;

        const speed = speedByCategoryId[cat._id] ?? 3000;
        const delay = idx * 1000;

        return (
          <CategoryRow
            key={cat._id}
            category={cat}
            items={items}
            autoPlayMs={speed}
            delay={delay}
          />
        );
      })}
    </div>
  );
}
