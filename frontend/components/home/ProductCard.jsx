"use client";

import React, { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaStar,
  FaHeart,
  FaShoppingCart,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { useCartUtils } from "../../hooks/useCartUtils";

const ProductCard = memo(
  ({ product }) => {
    const { cart, updateCart, wishlist, toggleWishlist } = useCartUtils();

    // ✅ ONLY MongoDB _id (critical fix)
    const productId = product?._id;
    if (!productId) return null;

    const quantity = cart[String(productId)] || 0;

    const discount = product?.oldPrice
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : 0;

    const isInWishlist = wishlist.includes(String(productId));
    const totalPrice = Number(product?.price || 0) * quantity;

    // ✅ ইমেজ লজিক আপডেট: মেইন ইমেজ -> গ্যালারি -> কালার ভেরিয়েন্ট ইমেজ
    const mainImage = useMemo(() => {
      // ১. যদি মেইন ইমেজ থাকে
      if (product?.image && product.image.startsWith("http")) {
        return product.image;
      }
      // ২. যদি গ্যালারি (images array) তে ইমেজ থাকে
      if (product?.images && product.images.length > 0) {
        return product.images[0];
      }
      // ৩. যদি কালার ভেরিয়েন্টের ভিতরে ইমেজ থাকে
      if (product?.colors && product.colors.length > 0) {
        const firstColorWithImage = product.colors.find(
          (c) => c.images && c.images.length > 0
        );
        if (firstColorWithImage) return firstColorWithImage.images[0];
      }

      return "/no-image.png";
    }, [product]);

    return (
      <div className="relative bg-pink-100 shadow-md rounded-lg hover:shadow-lg transition flex flex-col group">
        {/* IMAGE */}
        <Link
          href={`/products/${productId}`}
          className="relative w-full aspect-[4/4] mb-3 overflow-hidden rounded-lg bg-white"
        >
          {/* Top badges */}
          <div className="absolute top-1 left-1 right-1 flex justify-between z-10">
            {product?.oldPrice && (
              <span className="bg-red-500 text-white px-1 py-0.5 rounded-full text-[10px] font-semibold">
                -{discount}%
              </span>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(productId);
              }}
              className={`p-1.5 rounded-full shadow transition-colors ${
                isInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-red-100"
              }`}
            >
              <FaHeart className="w-3 h-3" />
            </button>
          </div>

          <Image
            src={mainImage}
            alt={product?.name || "Product"}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        {/* INFO */}
        <div className="px-3 pb-3">
          <h4 className="font-semibold text-sm sm:text-base truncate text-gray-800">
            {product?.name}
          </h4>

          <div className="flex items-center justify-between mb-1">
            <p
              className={`text-[10px] font-bold ${
                product?.stock > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {product?.stock > 0
                ? `In Stock (${product.stock})`
                : "Out of Stock"}
            </p>

            <span className="text-[10px] text-gray-500">
              Sold: {product.sold || 0}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center mb-1">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`w-3 h-3 ${
                  i < (product?.rating || 0)
                    ? "text-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-blue-600 font-bold text-sm sm:text-base">
              ৳{product?.price}
            </p>
            {product?.oldPrice && (
              <p className="text-gray-400 line-through text-[10px] sm:text-xs">
                ৳{product.oldPrice}
              </p>
            )}
          </div>

          {/* CART */}
          {!quantity ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateCart(productId, +1, product.stock);
              }}
              disabled={product?.stock <= 0}
              className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition ${
                product?.stock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-pink-600 text-white hover:bg-pink-700"
              }`}
            >
              <FaShoppingCart /> Add
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between bg-white/50 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateCart(productId, -1, product.stock);
                  }}
                  className="p-1 bg-white shadow-sm rounded text-pink-600"
                >
                  <FaMinus className="text-[10px]" />
                </button>

                <span className="text-sm font-bold text-gray-800">
                  {quantity}
                </span>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateCart(productId, +1, product.stock);
                  }}
                  className="p-1 bg-white shadow-sm rounded text-pink-600"
                >
                  <FaPlus className="text-[10px]" />
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-blue-600 mt-1">
                Total: ৳{totalPrice}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },

  // 🔥 Memo optimization
  (prev, next) =>
    prev.product._id === next.product._id &&
    prev.product.price === next.product.price &&
    prev.product.stock === next.product.stock &&
    prev.product.rating === next.product.rating &&
    JSON.stringify(prev.product.colors) ===
      JSON.stringify(next.product.colors) &&
    JSON.stringify(prev.product.images) === JSON.stringify(next.product.images)
);

export default ProductCard;
