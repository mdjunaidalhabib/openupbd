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

  // ✅ কালার থাকলে প্রথম কালার সিলেক্ট হবে, না থাকলে null
  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.length > 0 ? product.colors[0] : null
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("desc");

  // ✅ প্রোডাক্ট চেঞ্জ হলে (যেমন রিলেটেড প্রোডাক্টে ক্লিক করলে) স্টেট আপডেট হবে
  useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
    setActiveIdx(0);
  }, [product]);

  if (loading || !product?._id) return <ProductDetailsSkeleton />;

  // ✅ স্টক লজিক: সিলেক্টেড কালারের স্টক অথবা মেইন স্টক
  const currentStock = selectedColor ? selectedColor.stock : product.stock;
  const isOutOfStock = currentStock <= 0 || product.isSoldOut;

  // ✅ ইমেজ লজিক: কালার সিলেক্ট থাকলে ওই কালারের ছবি, নাহলে গ্যালারি
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

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  const quantity = cart[product._id] || 0;
  const totalPrice = product.price * quantity;

  const discountPct = product.oldPrice
    ? (((product.oldPrice - product.price) / product.oldPrice) * 100).toFixed(1)
    : null;

  const isInWishlist = wishlist.includes(product._id);

  const tabBtn = (key, label) => (
    <button
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

  const handleCheckout = async () => {
    if (isOutOfStock) return;
    if (!quantity || quantity === 0) {
      await updateCart(product._id, +1, currentStock);
    }
    router.push(
      `/checkout?productId=${product._id}&qty=${quantity || 1}${
        selectedColor ? `&color=${selectedColor.name}` : ""
      }`
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
      <section className="bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden border border-gray-100">
        <div className="bg-gray-50 rounded-xl p-2">
          <div className="relative w-full aspect-[4/5] max-h-[600px] rounded-lg overflow-hidden bg-white group mx-auto">
            <Image
              src={images[activeIdx] || "/no-image.png"}
              alt={product.name}
              fill
              priority
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
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                    i === activeIdx
                      ? "border-pink-600 ring-1 ring-pink-400"
                      : "border-transparent"
                  }`}
                >
                  <Image src={src} alt="thumb" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between px-6 py-6 bg-white">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                {product.name}
              </h1>
              <button
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

            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Category:{" "}
              <span className="text-gray-800">{category?.name || "N/A"}</span>
            </p>

            <div className="flex items-center gap-4 mb-4">
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
                <span className="text-xs font-bold">
                  {product.sold || 0} Sold
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
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

            <div className="flex items-baseline gap-3 mb-6">
              <p className="text-blue-600 font-extrabold text-4xl">
                ৳{product.price}
              </p>
              {product.oldPrice && (
                <p className="text-gray-400 line-through text-lg">
                  ৳{product.oldPrice}
                </p>
              )}
              {discountPct && (
                <span className="bg-pink-600 text-white px-2 py-0.5 rounded-md text-xs font-bold uppercase">
                  {discountPct}% OFF
                </span>
              )}
            </div>

            {product.colors?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Select Variant:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <button
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

          <div className="space-y-4 pt-4 border-t border-gray-50">
            {!quantity ? (
              <div className="flex gap-4">
                <button
                  disabled={isOutOfStock}
                  onClick={() => updateCart(product._id, +1, currentStock)}
                  className={`flex-1 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg shadow-pink-200"
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
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-400 uppercase mb-1">
                    Quantity
                  </span>
                  <QuantityController
                    qty={quantity}
                    stock={currentStock}
                    onChange={(change) =>
                      updateCart(product._id, change, currentStock)
                    }
                    allowZero={true}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">
                    Subtotal
                  </p>
                  <p className="text-blue-700 font-extrabold text-xl">
                    ৳{totalPrice}
                  </p>
                </div>
                <div
                  className={
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  <CheckoutButton
                    product={product}
                    productId={product._id}
                    qty={quantity}
                    onClick={handleCheckout}
                    disabled={isOutOfStock}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TABS SECTION */}
      <section className="mt-12">
        <div className="flex justify-center gap-4 border-b border-gray-100 mb-8">
          {tabBtn("desc", "Description")}
          {tabBtn("info", "Information")}
          {tabBtn("reviews", `Reviews (${product.reviews?.length || 0})`)}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-10 shadow-sm min-h-[200px]">
          {tab === "desc" && (
            <div className="whitespace-pre-line text-gray-600 leading-relaxed text-base">
              {product.description || "No description available."}
            </div>
          )}
          {tab === "info" && (
            <div className="whitespace-pre-line text-gray-600 leading-relaxed text-base">
              {product.additionalInfo || "No additional info."}
            </div>
          )}
          {tab === "reviews" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews?.length ? (
                product.reviews.map((r, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 p-6 rounded-2xl border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-800">{r.user}</span>
                      <div className="flex text-yellow-400 text-xs">
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm italic">
                      "{r.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-10 text-center text-gray-400">
                  No reviews yet for this product.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related?.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              You May Also Like
            </h3>
            <div className="h-[2px] flex-1 mx-6 bg-gray-100 hidden sm:block"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
