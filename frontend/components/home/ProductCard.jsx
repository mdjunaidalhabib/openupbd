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

const ProductCard = memo(({ product, priority = false }) => {
  const { cart, updateCart, wishlist, toggleWishlist } = useCartUtils();

  const productId = product?._id;
  if (!productId) return null;

  // ✅ pick default variant (first color)
  const defaultColor = product?.colors?.length > 0 ? product.colors[0] : null;

  // ✅ cartKey must include color to avoid stock mismatch
  const cartKey = defaultColor
    ? `${productId}|${defaultColor.name}`
    : String(productId);

  // ✅ quantity now read by cartKey
  const quantity = cart[String(cartKey)] || 0;

  const discount = product?.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const isInWishlist = wishlist.includes(String(productId));
  const totalPrice = Number(product?.price || 0) * quantity;

  const isSoldOut =
    product?.isSoldOut === true || product?.isSoldOut === "true";

  // ✅ stock: use default variant stock, not sum
  const computedStock = useMemo(() => {
    if (defaultColor) return Number(defaultColor?.stock ?? 0) || 0;
    return Number(product?.stock ?? 0) || 0;
  }, [product, defaultColor]);

  const isOutOfStock = computedStock <= 0 || isSoldOut;

  const mainImage = useMemo(() => {
    if (defaultColor?.images?.length > 0) return defaultColor.images[0];
    if (product?.image && product.image.startsWith("http"))
      return product.image;
    if (product?.images?.length > 0) return product.images[0];
    return "/no-image.png";
  }, [product, defaultColor]);

  return (
    <div className="relative bg-pink-100 shadow-md rounded-lg hover:shadow-lg transition flex flex-col group">
      <Link
        href={`/products/${productId}`}
        className="relative w-full aspect-[4/4] mb-3 overflow-hidden rounded-lg bg-white"
      >
        <div className="absolute top-1 left-1 right-1 flex justify-between z-10">
          {product?.oldPrice && (
            <span className="bg-red-500 text-white px-1 py-0.5 rounded-full text-[10px] font-semibold">
              -{discount}%
            </span>
          )}

          <button
            type="button"
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="px-3 pb-3">
        <h4 className="font-semibold text-sm sm:text-base truncate text-gray-800">
          {product?.name}
        </h4>

        <div className="flex items-center justify-between mb-1">
          <p
            className={`text-[10px] font-bold ${
              !isOutOfStock ? "text-green-600" : "text-red-500"
            }`}
          >
            {!isOutOfStock ? `In Stock (${computedStock})` : "Out of Stock"}
          </p>

          {/* ✅ show default variant label */}
          {defaultColor?.name && (
            <p className="text-[10px] font-bold text-pink-600 mb-1">
              Variant: {defaultColor.name}
            </p>
          )}

          <span className="text-[10px] text-gray-500">
            Sold: {Number(product?.sold ?? 0) || 0}
          </span>
        </div>

        <div className="flex items-center mb-1">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={`w-3 h-3 ${
                i < (product?.rating || 0) ? "text-yellow-500" : "text-gray-300"
              }`}
            />
          ))}
        </div>

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

        {!quantity ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // ✅ add with variant cartKey + variant stock
              updateCart(cartKey, +1, computedStock);
            }}
            disabled={isOutOfStock}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition ${
              isOutOfStock
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCart(cartKey, -1, computedStock);
                }}
                className="p-1 bg-white shadow-sm rounded text-pink-600"
              >
                <FaMinus className="text-[10px]" />
              </button>

              <span className="text-sm font-bold text-gray-800">
                {quantity}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateCart(cartKey, +1, computedStock);
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
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
