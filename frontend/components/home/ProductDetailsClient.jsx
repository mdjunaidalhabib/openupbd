"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaStar, FaHeart, FaFire, FaShoppingBag } from "react-icons/fa";
import ProductCard from "./ProductCard";
import { useCartUtils } from "../../hooks/useCartUtils";
import QuantityController from "./QuantityController";
import CheckoutButton from "./CheckoutButton";
import ProductDetailsSkeleton from "../skeletons/ProductDetailsSkeleton";
import { useRouter } from "next/navigation";

export default function ProductDetailsClient({
  product,
  category,
  related = [],
  loading = false,
}) {
  const { cart, wishlist, toggleWishlist, updateCart } = useCartUtils();
  const router = useRouter();

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.length > 0 ? product.colors[0] : null
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("desc");

  useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
    setActiveIdx(0);
  }, [product]);

  if (loading || !product?._id) return <ProductDetailsSkeleton />;

  // ✅ normalize isSoldOut (can be "true")
  const isSoldOut =
    product?.isSoldOut === true || product?.isSoldOut === "true";

  // ✅ normalize stock to NUMBER (variant stock first)
  const currentStockRaw = selectedColor?.stock ?? product?.stock ?? 0;
  const currentStock = Number(currentStockRaw) || 0;

  // ✅ final out of stock
  const isOutOfStock = currentStock <= 0 || isSoldOut;

  // ✅ cartKey must include variant (color)
  const cartKey = selectedColor?.name
    ? `${product._id}|${selectedColor.name}`
    : String(product._id);

  // ✅ quantity must read by cartKey
  const quantity = cart[String(cartKey)] || 0;

  // ✅ total price always numeric
  const totalPrice = Number(product?.price || 0) * Number(quantity || 0);

  const images = useMemo(() => {
    if (selectedColor && selectedColor.images?.length > 0) {
      return selectedColor.images;
    }

    const gallery = Array.isArray(product.images) ? product.images : [];
    const main =
      product.image && product.image.startsWith("http") ? product.image : null;

    if (main && !gallery.includes(main)) return [main, ...gallery];
    if (gallery.length > 0) return gallery;

    return ["/no-image.png"];
  }, [product, selectedColor]);

  // ✅ safety: if images change and activeIdx becomes invalid
  useEffect(() => {
    if (!images?.length) return;
    if (activeIdx >= images.length) setActiveIdx(0);
  }, [images, activeIdx]);

  // ✅ autoplay slider (✅ dependency fixed)
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  // ✅ oldPrice and discount logic
  const hasOldPrice =
    product.oldPrice && Number(product.oldPrice) > Number(product.price || 0);

  const discountPct = hasOldPrice
    ? (
        ((Number(product.oldPrice) - Number(product.price)) /
          Number(product.oldPrice)) *
        100
      ).toFixed(1)
    : null;

  // ✅ wishlist normalize
  const isInWishlist = wishlist.includes(String(product._id));

  // ✅ ✅ SOLD Count Variant Aware (FIXED)
  const soldCount = Number(selectedColor?.sold ?? product?.sold ?? 0) || 0;

  // ✅ Professional Tabs Button
  const tabBtn = (key, label) => (
    <button
      type="button"
      key={key}
      onClick={() => setTab(key)}
      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        tab === key
          ? "bg-pink-500 text-white shadow"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  // ✅ checkout will pass stock + color via URL (AND cartKey qty)
  const handleCheckout = async () => {
    if (isOutOfStock) return;

    // ✅ If quantity is 0, add 1 first (variant key)
    if (!quantity || quantity === 0) {
      await updateCart(cartKey, +1, currentStock);
    }

    const finalQty = quantity || 1;

    router.push(
      `/checkout?productId=${product._id}&qty=${finalQty}${
        selectedColor ? `&color=${encodeURIComponent(selectedColor.name)}` : ""
      }&stock=${currentStock}`
    );
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link
              href={`/categories/${category._id}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-700">{product.name}</span>
      </nav>

      {/* PRODUCT SECTION */}
      <section className="bg-pink-50 rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden border border-gray-100">
        <div className="bg-pink-50 rounded-xl">
          <div className="relative w-full aspect-[4/4] max-h-[600px] rounded-lg overflow-hidden bg-white group mx-auto">
            <Image
              src={images[activeIdx] || "/no-image.png"}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-xl tracking-widest shadow-lg">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-2 flex gap-2 justify-center overflow-x-auto no-scrollbar py-1">
              {images.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                    i === activeIdx
                      ? "border-pink-600 ring-1 ring-pink-400"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`thumb-${i}`}
                    fill
                    sizes="56px"
                    loading="lazy"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        {/* ✅ justify-between remove করা হয়েছে + gap add করা হয়েছে */}
        <div className="flex flex-col px-6 py-6 bg-pink-50 gap-4">
          {/* TOP CONTENT */}
          <div>
            <div className="flex justify-between items-start mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                {product.name}
              </h1>

              {/* ✅ Wishlist button heading এর পাশ থেকে সরানো হয়েছে */}
            </div>

            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Category:{" "}
              <span className="text-gray-800">{category?.name || "N/A"}</span>
            </p>

            <div className="flex items-center gap-4 mb-3">
              <p
                className={`text-sm font-bold flex items-center gap-1 ${
                  isOutOfStock ? "text-red-500" : "text-green-600"
                }`}
              >
                {isOutOfStock ? "✕ Out of Stock" : "✓ In Stock"}
                <span className="font-normal text-gray-400 ml-1">
                  ({currentStock} left)
                </span>
              </p>

              <div className="h-4 w-[1px] bg-gray-200"></div>

              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
                <FaFire className="text-[10px] animate-bounce" />
                <span className="text-xs font-bold">{soldCount} Sold</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={
                        i < (product.rating || 0) ? "" : "text-gray-200"
                      }
                    />
                  ))}
                </div>

                <span className="text-xs font-bold text-gray-500 ml-1">
                  ({product.rating || 0}/5)
                </span>
              </div>
            </div>
            <div className="md:my-8">
              <div className="flex items-center justify-between gap-3">
                {/* LEFT: PRICE */}
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p className="text-blue-600 font-extrabold text-4xl tracking-tight">
                    ৳{product.price}
                  </p>

                  {hasOldPrice && (
                    <p className="text-gray-400 text-sm font-medium">
                      <span className="line-through decoration-gray-400 decoration-2">
                        ৳{product.oldPrice}
                      </span>
                    </p>
                  )}

                  {discountPct && (
                    <span className="bg-pink-600/90 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* RIGHT: WISHLIST */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product._id)}
                  className={`p-3 rounded-full shadow-md transition-all ${
                    isInWishlist
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-400 hover:text-red-500"
                  }`}
                >
                  <FaHeart />
                </button>
              </div>

              {hasOldPrice && discountPct && (
                <p className="mt-1 text-sm text-emerald-600 font-semibold">
                  You save ৳{product.oldPrice - product.price}
                </p>
              )}
            </div>

            {product.colors?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Select Variant:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setSelectedColor(color);
                        setActiveIdx(0);
                      }}
                      className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
                        selectedColor?.name === color.name
                          ? "border-pink-600 bg-pink-600 text-white shadow-lg shadow-pink-200"
                          : "border-gray-200 bg-white text-gray-600 hover:border-pink-300"
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            {!quantity ? (
              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => updateCart(cartKey, +1, currentStock)}
                  className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-pink-600 text-white hover:bg-pink-700"
                  }`}
                >
                  <FaShoppingBag className="text-sm" />
                  {isOutOfStock ? "Sold Out" : "Add to Cart"}
                </button>

                <div
                  className={`flex-1 ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CheckoutButton
                    product={product}
                    productId={product._id}
                    qty={1}
                    onClick={handleCheckout}
                    disabled={isOutOfStock}
                    stock={currentStock}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2  rounded-2xl ">
                {/* LEFT */}
                <div className="flex justify-center min-w-[110px]">
                  <QuantityController
                    qty={quantity}
                    stock={currentStock}
                    onChange={(change) =>
                      updateCart(cartKey, change, currentStock)
                    }
                    allowZero={true}
                  />
                </div>

                {/* CENTER */}
                <div className="text-center">
                  <p className="text-blue-700 font-extrabold text-xl">
                    ৳{totalPrice}
                  </p>
                </div>

                {/* RIGHT */}
                <div
                  className={`flex justify-end ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CheckoutButton
                    product={product}
                    productId={product._id}
                    qty={quantity}
                    onClick={handleCheckout}
                    disabled={isOutOfStock}
                    stock={currentStock}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TABS */}
      <section className="mt-12">
        {/* Tabs Header */}
        <div className="border-b flex border-gray-200 ">
          <div className="max-w-6xl mx-auto flex gap-4 px-2">
            {tabBtn("desc", "Description")}
            {tabBtn("info", "Information")}
            {tabBtn("reviews", `Reviews (${product.reviews?.length || 0})`)}
          </div>
        </div>

        {/* Tabs Content */}
        <div className="max-w-6xl mx-auto px-2 py-8">
          {tab === "desc" && (
            <div
              lang="en"
              className="text-gray-700 leading-7 text-[15px] whitespace-pre-line text-justify hyphens-auto tracking-[0.2px]"
            >
              {product.description ? (
                product.description
              ) : (
                <div className="text-gray-500 text-center">
                  No description available for this product.
                </div>
              )}
            </div>
          )}

          {tab === "info" && (
            <div
              lang="en"
              className="text-gray-700 leading-7 text-[15px] whitespace-pre-line text-justify hyphens-auto tracking-[0.2px]"
            >
              {product.additionalInfo ? (
                product.additionalInfo
              ) : (
                <div className="text-gray-500 text-center">
                  No additional info available for this product.
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {product.reviews?.length ? (
                product.reviews.map((r, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{r.user}</p>
                        <div className="flex text-yellow-400 text-sm mt-1">
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-6">
                      {r.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2">
                  <div className="text-center text-gray-500">
                    No reviews yet for this product.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RELATED */}
      {related?.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              You May Also Like
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map((p, i) => (
              <ProductCard key={p._id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
