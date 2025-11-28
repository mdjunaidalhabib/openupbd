"use client";
import React, { useEffect, useState, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";
import { FaPlus, FaMinus, FaTrash, FaHeart } from "react-icons/fa";
import { apiFetch } from "../../../utils/api";
import CheckoutButton from "../../../components/home/CheckoutButton";
import CartSkeleton from "../../../components/skeletons/CartSkeleton";

// ✅ Memoized single Cart Item component
const CartItem = memo(
  ({ p, updateCart, removeFromCart, toggleWishlist, wishlist }) => {
    const discount =
      p.oldPrice && (((p.oldPrice - p.price) / p.oldPrice) * 100).toFixed(1);
    const isInWishlist = wishlist.includes(p._id);

    return (
      <div className="bg-pink-100 rounded-lg shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition-all duration-300">
        {/* ✅ Image Left */}
        <Link
          href={`/products/${p._id}`}
          className="relative w-20 h-20 flex-shrink-0"
        >
          <Image
            src={p.image}
            alt={p.name}
            fill
            className="object-contain rounded"
          />
        </Link>

        {/* ✅ Info Right */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <Link
              href={`/products/${p._id}`}
              className="font-semibold text-sm sm:text-base text-gray-800 hover:underline"
            >
              {p.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-blue-600 font-bold text-sm">
                ৳{p.price}
              </span>
              {p.oldPrice && (
                <span className="line-through text-gray-400 text-xs">
                  ৳{p.oldPrice}
                </span>
              )}
              {discount && (
                <span className="text-red-500 text-xs font-medium">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* ✅ Quantity + Buttons Row */}
          <div className="flex items-center justify-between mt-2">
            {/* Qty Control */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => p.qty > 1 && updateCart(p._id, -1)}
                className={`p-2 rounded text-white text-xs ${
                  p.qty > 1
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <FaMinus />
              </button>
              <span className="font-bold text-sm">{p.qty}</span>
              <button
                onClick={() => updateCart(p._id, +1)}
                className="bg-green-500 text-white p-2 rounded text-xs hover:bg-green-600"
              >
                <FaPlus />
              </button>
            </div>

            {/* Remove / Wishlist */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeFromCart(p._id)}
                className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-red-700"
              >
                <FaTrash /> <span>রিমুভ</span>
              </button>
              <button
                onClick={() => toggleWishlist(p._id)}
                className={`p-2 rounded-full ${
                  isInWishlist
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                <FaHeart size={12} />
              </button>
            </div>
          </div>

          {/* ✅ Total */}
          <div className="text-blue-600 font-semibold text-sm mt-2 text-right">
            মোট: ৳{p.price * p.qty}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.p._id === nextProps.p._id &&
      prevProps.p.qty === nextProps.p.qty &&
      prevProps.wishlist === nextProps.wishlist
    );
  }
);

export default function CartPage() {
  const {
    cart,
    setCart,
    wishlist,
    updateCart,
    removeFromCart,
    toggleWishlist,
  } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/products")
      .then((data) => {
        setAllProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const items = useMemo(() => {
    if (!allProducts.length) return [];
    return Object.keys(cart)
      .map((id) => {
        const p = allProducts.find((x) => String(x._id) === id);
        if (!p) return null;
        return { ...p, qty: cart[id] };
      })
      .filter(Boolean);
  }, [cart, allProducts]);

  const grandTotal = items.reduce((sum, p) => sum + p.price * p.qty, 0);
  const handleClearCart = () => setCart({});

  return (
    <main className="bg-pink-50 ">
      <div className="container mx-auto px-3 sm:px-6 py-6">
        {/* ✅ Header */}
        <div className="mb-2">
          {/* টাইটেল — সবসময় প্রথম লাইনে */}
          <h2 className="text-center text-xl sm:text-2xl font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 text-transparent bg-clip-text mb-3">
            🛒 আপনার কার্ট
          </h2>

          {/* বাটন — সবসময় দ্বিতীয় লাইনে */}
          {items.length > 0 && !loading && (
            <div className="flex justify-end">
              <button
                onClick={handleClearCart}
                className="
                  bg-red-500 text-white 
                  px-3 py-1.5 sm:px-4 sm:py-2
                  text-xs sm:text-sm font-medium
                  rounded-md sm:rounded-lg
                  hover:bg-red-600 transition
                "
              >
                সব মুছে ফেলুন
              </button>
            </div>
          )}
        </div>

        {/* Loader */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartSkeleton key={i} />
            ))}
          </div>
        ) : !items.length ? (
          <div className="bg-pink-100 rounded-xl shadow p-6 text-center">
            <p className="text-gray-500 text-lg">আপনার কার্ট খালি 😢</p>
            <Link
              href="/products"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              পণ্য দেখুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((p) => (
              <CartItem
                key={p._id}
                p={p}
                updateCart={updateCart}
                removeFromCart={removeFromCart}
                toggleWishlist={toggleWishlist}
                wishlist={wishlist}
              />
            ))}

            {/* ✅ Grand Total */}
            <div className="text-right font-bold text-lg mt-6 border-t pt-4">
              মোট মূল্য: <span className="text-blue-600">৳{grandTotal}</span>
            </div>

            {/* ✅ Checkout Button */}
            <div className="pb-8 flex justify-end">
              <CheckoutButton label="চেকআউট করুন" fullWidth={false} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
