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
import { useCart } from "../../context/CartContext";

// ✅ Memoized Product Card
const ProductCard = memo(
  ({ product }) => {
    const { cart, updateCart, wishlist, toggleWishlist } = useCart();

    const productId = product?._id || product?.id;
    const quantity = cart[productId] || 0;

    const discount = product?.oldPrice
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : 0;

    const isInWishlist = wishlist.includes(String(productId));
    const totalPrice = product?.price * quantity;

    const mainImage =
      product?.image && product.image.startsWith("http")
        ? product.image
        : product?.images?.[0] || "/no-image.png";

    return (
      <div className="relative bg-pink-100 shadow-md rounded-lg hover:shadow-lg transition flex flex-col">
        {/* 🖼️ Image Container */}
        <Link
          href={`/products/${productId}`}
          className="relative w-full h-40 sm:h-48 md:h-52 mb-3 overflow-hidden rounded-lg"
        >
          {/* 🏷️ Discount & Wishlist */}
          <div className="absolute top-1 left-1 right-1 flex justify-between items-center z-10">
            {product?.oldPrice && (
              <div className="bg-red-500 text-white px-1 py-0.5 rounded-full text-xs font-semibold shadow-sm transition-transform hover:scale-105 tracking-tight">
                -{discount}%
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(productId);
              }}
              className={`px-1 py-1 rounded-full shadow-md transition transform hover:scale-110 ${
                isInWishlist
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              <FaHeart className="w-4 h-4" />
            </button>
          </div>

          {/* 🖼️ Product Image */}
          <Image
            src={mainImage}
            alt={product?.name || "Product"}
            fill
            className="object-cover rounded-lg"
            priority
            onError={(e) => {
              e.currentTarget.src = "/no-image.png";
            }}
          />
        </Link>

        {/* 📋 Product Info */}
        <div className="px-4 pb-2 transition-all duration-300">
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

          {/* ⭐ Ratings */}
          <div className="flex items-center mb-1">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={
                  i < product?.rating
                    ? "text-yellow-500 w-3"
                    : "text-gray-300 w-3"
                }
              />
            ))}
          </div>

          {/* 💰 Price */}
          <div className="flex items-center space-x-2">
            <p className="text-blue-600 font-bold text-sm sm:text-base">
              ৳{product?.price}
            </p>
            {product?.oldPrice && (
              <p className="text-gray-400 line-through text-xs sm:text-sm">
                ৳{product.oldPrice}
              </p>
            )}
          </div>

          {/* 🛒 Cart Buttons */}
          {!quantity ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateCart(productId, +1, true);
              }}
              disabled={product?.stock <= 0}
              className={`my- sm:mt-4 sm:mb-2 w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base ${
                product?.stock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-pink-600 text-white hover:bg-pink-700"
              }`}
            >
              <FaShoppingCart /> Add
            </button>
          ) : (
            <div className="transition-all duration-300">
              {/* Quantity Row */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm">
                  Quantity:
                </span>
                <div className="flex items-center rounded-md px-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCart(productId, -1, false); // ➖ বাটনে সবসময় false
                    }}
                    className="p-1.5 sm:p-1 bg-gray-200 hover:bg-gray-300 rounded-md transition"
                  >
                    <FaMinus className="text-[10px] sm:text-xs" />
                  </button>

                  <span className="text-xs sm:text-sm font-bold w-4 text-center select-none">
                    {quantity}
                  </span>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCart(productId, +1, false); // ➕ বাটনে সবসময় false
                    }}
                    className="p-1.5 sm:p-1 bg-gray-200 hover:bg-gray-300 rounded-md transition"
                  >
                    <FaPlus className="text-[10px] sm:text-xs" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-gray-300 my-1" />

              {/* Total */}
              <p className="text-center font-semibold text-gray-700 text-xs sm:text-sm">
                Total: <span className="text-blue-600">৳{totalPrice}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
  // ✅ Prevent unnecessary re-renders
  (prev, next) => {
    return (
      prev.product._id === next.product._id &&
      prev.product.price === next.product.price
    );
  }
);

export default ProductCard;
