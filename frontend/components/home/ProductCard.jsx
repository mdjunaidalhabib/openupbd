"use client";

import React, { memo } from "react";
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

    const mainImage =
      product?.image && product.image.startsWith("http")
        ? product.image
        : product?.images?.[0] || "/no-image.png";

    return (
      <div className="relative bg-pink-100 shadow-md rounded-lg hover:shadow-lg transition flex flex-col group">
        {/* IMAGE */}
        <Link
          href={`/products/${productId}`}
          className="relative w-full aspect-[4/4] mb-3 overflow-hidden rounded-lg"
        >
          {/* Top badges */}
          <div className="absolute top-1 left-1 right-1 flex justify-between z-10">
            {product?.oldPrice && (
              <span className="bg-red-500 text-white px-1 py-0.5 rounded-full text-xs font-semibold">
                -{discount}%
              </span>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(productId);
              }}
              className={`px-1 py-1 rounded-full shadow ${
                isInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              <FaHeart className="w-4 h-4" />
            </button>
          </div>

          <Image
            src={mainImage}
            alt={product?.name || "Product"}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw,
                   (max-width: 1200px) 33vw,
                   25vw"
            className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        {/* INFO */}
        <div className="px-4 pb-3">
          <h4 className="font-semibold text-base sm:text-lg truncate">
            {product?.name}
          </h4>

          <p
            className={`text-xs font-medium ${
              product?.stock > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {product?.stock > 0
              ? `In Stock (${product.stock})`
              : "Out of Stock"}
          </p>

          {/* Rating */}
          <div className="flex items-center mb-1">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={
                  i < (product?.rating || 0)
                    ? "text-yellow-500 w-3"
                    : "text-gray-300 w-3"
                }
              />
            ))}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-blue-600 font-bold text-sm sm:text-base">
              ৳{product?.price}
            </p>
            {product?.oldPrice && (
              <p className="text-gray-400 line-through text-xs sm:text-sm">
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
              className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                product?.stock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-pink-600 text-white hover:bg-pink-700"
              }`}
            >
              <FaShoppingCart /> Add
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Qty</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCart(productId, -1, product.stock);
                    }}
                    className="p-1 bg-gray-200 rounded"
                  >
                    <FaMinus className="text-xs" />
                  </button>

                  <span className="text-xs font-bold w-4 text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCart(productId, +1, product.stock);
                    }}
                    className="p-1 bg-gray-200 rounded"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                </div>
              </div>

              <p className="text-center text-xs font-semibold mt-1">
                Total: <span className="text-blue-600">৳{totalPrice}</span>
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
    prev.product.rating === next.product.rating
);

export default ProductCard;
