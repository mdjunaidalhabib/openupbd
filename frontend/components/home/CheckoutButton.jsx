"use client";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import { useState, useCallback, useMemo } from "react";

export default function CheckoutButton({
  product,
  productId,
  qty = 1,
  total,
  fullWidth,
  onClick,
  label,

  // ✅ pass actual stock from product details (variant stock)
  stock,

  // ✅ pass color name (for single product checkout)
  color,

  // ✅ cart checkout support (items array)
  checkoutItems,

  // ✅ external control
  disabled,
  loading: externalLoading,
}) {
  const router = useRouter();
  const { me } = useUser();
  const [loading, setLoading] = useState(false);

  const mergedLoading = Boolean(externalLoading || loading);

  // ✅ Always normalize stock as number
  const currentStock = useMemo(() => {
    const s =
      stock !== undefined && stock !== null ? stock : product?.stock ?? 0;

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }, [stock, product?.stock]);

  const isOutOfStock = currentStock <= 0;

  // ✅ cart mode out-of-stock check
  const cartHasOutOfStock = useMemo(() => {
    if (!Array.isArray(checkoutItems) || checkoutItems.length === 0)
      return false;

    return checkoutItems.some((it) => {
      const st = Number(it?.stock ?? Infinity);
      const q = Number(it?.qty ?? 0);
      return st <= 0 || q <= 0 || q > st;
    });
  }, [checkoutItems]);

  const handleClick = useCallback(async () => {
    if (mergedLoading) return;

    if (disabled) return;

    // ✅ prevent checkout if cart contains out-of-stock
    if (cartHasOutOfStock) return;

    // ✅ single product out-of-stock block
    if (!checkoutItems && isOutOfStock) return;

    setLoading(true);

    try {
      // ✅ build checkout url (product OR cart)
      const checkoutUrl = (() => {
        // ✅ cart checkout
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          const payload = encodeURIComponent(JSON.stringify(checkoutItems));
          return `${window.location.origin}/checkout?items=${payload}`;
        }

        // ✅ single product checkout (include color + stock)
        if (productId) {
          const c = color ? `&color=${encodeURIComponent(color)}` : "";
          const s = `&stock=${encodeURIComponent(String(currentStock))}`;
          return `${window.location.origin}/checkout?productId=${productId}&qty=${qty}${c}${s}`;
        }

        return `${window.location.origin}/checkout`;
      })();

      // 🔹 User not logged in → redirect to Google Auth
      if (!me) {
        window.location.href = `${
          process.env.NEXT_PUBLIC_AUTH_API_URL
        }/auth/google?redirect=${encodeURIComponent(checkoutUrl)}`;
        return;
      }

      // 🔹 যদি custom onClick থাকে → ওটা execute করো
      if (onClick) {
        await onClick();
        return;
      }

      // 🔹 redirect to checkout
      const redirectPath = (() => {
        // ✅ cart checkout
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          const payload = encodeURIComponent(JSON.stringify(checkoutItems));
          return `/checkout?items=${payload}`;
        }

        // ✅ single product checkout (include color + stock)
        if (productId) {
          const c = color ? `&color=${encodeURIComponent(color)}` : "";
          const s = `&stock=${encodeURIComponent(String(currentStock))}`;
          return `/checkout?productId=${productId}&qty=${qty}${c}${s}`;
        }

        return `/checkout`;
      })();

      router.push(redirectPath);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(false);
    }
  }, [
    mergedLoading,
    disabled,
    cartHasOutOfStock,
    checkoutItems,
    isOutOfStock,
    me,
    onClick,
    productId,
    qty,
    router,
    color,
    currentStock,
  ]);

  const isDisabled =
    Boolean(disabled) ||
    mergedLoading ||
    cartHasOutOfStock ||
    (!checkoutItems && isOutOfStock);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${fullWidth ? "w-full" : "w-auto"} 
        px-4 sm:px-24 py-3 font-medium rounded-lg
        bg-green-600 hover:bg-green-700 transition-colors duration-200
        text-white shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
    >
      {mergedLoading ? (
        <>
          <span className="animate-spin">⏳</span> Processing...
        </>
      ) : label ? (
        label
      ) : total ? (
        `অর্ডার কনফার্ম করুন ৳${total}`
      ) : cartHasOutOfStock ? (
        "Out of Stock"
      ) : (
        "Checkout"
      )}
    </button>
  );
}
