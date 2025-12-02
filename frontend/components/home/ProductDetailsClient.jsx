"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaStar, FaHeart } from "react-icons/fa";
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

  if (loading || !product?._id) return <ProductDetailsSkeleton />;

  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState("desc");

  // ✅ ছবি হ্যান্ডলিং
  const images = useMemo(() => {
    const gallery = Array.isArray(product.images) ? product.images : [];
    const main =
      product.image && product.image.startsWith("http") ? product.image : null;

    if (main && !gallery.includes(main)) return [main, ...gallery];
    if (gallery.length > 0) return gallery;
    return ["/no-image.png"];
  }, [product]);

  const quantity = cart[product._id] || 0;
  const totalPrice = product.price * quantity;
  const discountPct = product.oldPrice
    ? (((product.oldPrice - product.price) / product.oldPrice) * 100).toFixed(1)
    : null;
  const isInWishlist = wishlist.includes(product._id);

  const tabBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        tab === key
          ? "bg-pink-500 text-white shadow"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  // ✅ Checkout লজিক
  const handleCheckout = async () => {
    if (product.stock <= 0) return;

    if (!quantity || quantity === 0) {
      await updateCart(product._id, +1, product.stock);
    }

    router.push(`/checkout?productId=${product._id}&qty=${quantity || 1}`);
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

      {/* 🖼️ Gallery + Summary এক কার্ডে */}
      <section className="bg-pink-100 rounded-2xl shadow p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Image */}
        <div className="bg-pink-50 rounded-xl">
          <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] rounded-lg overflow-hidden bg-gray-100 group">
            <Image
              src={images[activeIdx] || "/no-image.png"}
              alt={product?.name || "Product"}
              fill
              className="object-cover rounded-lg transition-transform duration-500 ease-in-out group-hover:scale-110"
              priority
              onError={(e) => (e.currentTarget.src = "/no-image.png")}
            />
          </div>

          {/* ✅ Thumbnail Gallery (No Scroll + Glow Effect) */}
          {images.length > 1 && (
            <div
              className="mt-3 flex gap-3 flex-wrap justify-center overflow-hidden"
              style={{
                maxHeight: "none",
                overscrollBehavior: "contain",
              }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border transition-all duration-200 
        ${
          i === activeIdx
            ? "border-pink-600 ring-2 ring-pink-400 shadow-lg"
            : "border-pink-200 hover:border-pink-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]"
        }`}
                >
                  <Image
                    src={src || "/no-image.png"}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
              {product.name}
            </h1>

            {category?.name && (
              <p className="text-sm text-gray-600 mb-1">
                Category: {category.name}
              </p>
            )}

            <p
              className={`text-sm font-medium mb-3 ${
                product.stock > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {product.stock > 0
                ? `✅ In Stock (${product.stock} available)`
                : "❌ Out of Stock"}
            </p>

            {/* ⭐ Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={
                      i < (product.rating || 0)
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating || 0}/5
              </span>
            </div>

            {/* 💰 Price + Wishlist */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-blue-600 font-bold text-2xl">
                  ৳{product.price}
                </p>
                {product.oldPrice && (
                  <p className="text-gray-400 line-through text-lg">
                    ৳{product.oldPrice}
                  </p>
                )}
                {discountPct && (
                  <span className="text-red-500 font-semibold">
                    -{discountPct}%
                  </span>
                )}
              </div>

              <button
                onClick={() => toggleWishlist(product._id)}
                className={`p-3 rounded-full shadow transition-all duration-200 ${
                  isInWishlist
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaHeart />
              </button>
            </div>
          </div>

          {/* 🛒 Cart + Checkout */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
            {!quantity ? (
              <>
                <button
                  disabled={product.stock <= 0}
                  onClick={() => updateCart(product._id, +1, product.stock)}
                  className={`flex-1 md:flex-[2] px-4 py-3 rounded-lg font-medium transition-all ${
                    product.stock > 0
                      ? "bg-pink-600 text-white hover:bg-pink-700"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  Add to Cart
                </button>

                <CheckoutButton
                  product={product}
                  productId={product._id}
                  qty={1}
                  onClick={handleCheckout}
                />
              </>
            ) : (
              <>
                <div className="flex-1 md:flex-[2] flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:font-medium">Quantity</span>
                    <QuantityController
                      qty={quantity}
                      stock={product.stock}
                      onChange={(change) =>
                        updateCart(product._id, change, product.stock)
                      }
                      allowZero={true}
                    />
                  </div>
                  <p className="text-sm font-medium">
                    Total:{" "}
                    <span className="text-blue-600 font-semibold">
                      ৳{totalPrice}
                    </span>
                  </p>
                </div>

                <CheckoutButton
                  product={product}
                  productId={product._id}
                  qty={quantity}
                  onClick={handleCheckout}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* 📋 Tabs */}
      <section className="mt-8">
        <div className="inline-flex bg-pink-100 rounded-xl p-1">
          {tabBtn("desc", "Description")}
          {tabBtn("info", "Additional Information")}
          {tabBtn("reviews", "Reviews")}
        </div>

        <div className="mt-4 bg-pink-100 rounded-2xl shadow p-4 sm:p-6 text-gray-700 leading-relaxed">
          {tab === "desc" && (
            <p className="whitespace-pre-wrap">
              {product.description || "No description available."}
            </p>
          )}
          {tab === "info" && (
            <p className="whitespace-pre-wrap">
              {product.additionalInfo || "No additional information provided."}
            </p>
          )}
          {tab === "reviews" && (
            <div className="text-sm">
              {product.reviews?.length ? (
                product.reviews.map((r, i) => (
                  <div key={i} className="border-b py-2">
                    <p className="font-semibold">
                      {r.user}{" "}
                      <span className="text-yellow-500">
                        {"★".repeat(r.rating)}
                      </span>{" "}
                      <span className="text-gray-500">{r.rating}/5</span>
                    </p>
                    <p>{r.comment}</p>
                  </div>
                ))
              ) : (
                <p>No reviews yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 🧩 Related Products */}
      {related?.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">
              Related products
            </h3>
            {category && (
              <Link
                href={`/categories/${category._id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View all in {category.name}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
