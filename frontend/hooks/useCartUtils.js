"use client";
import { useCart } from "../context/CartContext";

export function useCartUtils() {
  const {
    cart,
    setCart,
    wishlist,
    setWishlist,
    removeFromCart,
    updateCart: contextUpdateCart,
    toggleWishlist: contextToggleWishlist,
  } = useCart();

  /**
   * ✅ Cart update (100% consistent with ProductCard + CartContext)
   * Signature: (id, change, isFromAddButton)
   *
   * - id always normalized to string key
   * - stock guard supported as optional 3rd arg (number)
   *   but if boolean provided, it behaves like isFromAddButton
   */
  const updateCart = (id, change = 1, thirdArg = false) => {
    const key = String(id);

    // If thirdArg is a number => treat as stock limit (legacy support)
    if (typeof thirdArg === "number") {
      const stock = thirdArg;

      setCart((prev) => {
        const currentQty = prev[key] || 0;
        const newQty = currentQty + change;

        if (newQty <= 0) {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        }

        if (stock && newQty > stock) return prev;
        return { ...prev, [key]: newQty };
      });

      return;
    }

    // Otherwise thirdArg is boolean => isFromAddButton (new consistent way)
    const isFromAddButton = !!thirdArg;
    contextUpdateCart(key, change, isFromAddButton);
  };

  /**
   * ✅ Wishlist toggle (consistent everywhere)
   * - always uses string id
   * - uses setWishlist if available, fallback to contextToggleWishlist
   */
  const toggleWishlist = (id) => {
    const wishId = String(id);

    if (typeof setWishlist === "function") {
      setWishlist((prev) =>
        prev.includes(wishId)
          ? prev.filter((x) => x !== wishId)
          : [...prev, wishId]
      );
      return;
    }

    // fallback
    contextToggleWishlist(wishId);
  };

  // 💰 Subtotal calculation (unchanged)
  const calcSubtotal = (items) =>
    items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return {
    cart,
    setCart,
    wishlist,
    setWishlist,
    removeFromCart,
    updateCart, // (id, change, isFromAddButton OR stockNumber)
    toggleWishlist,
    calcSubtotal,
  };
}
