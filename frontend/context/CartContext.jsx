"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [uniqueCount, setUniqueCount] = useState(0); // 🔹 আলাদা প্রোডাক্ট সংখ্যা ট্র্যাক

  const updateCart = (id, change = 1, isFromAddButton = false) => {
    setCart((prev) => {
      const exists = prev[id] || 0;
      let newCart = { ...prev };

      // ✅ শুধু প্রথমবার Add করলে unique count বাড়াবে
      if (isFromAddButton && !exists) {
        setUniqueCount((prevCount) => prevCount + 1);
      }

      const newQty = exists + change;

      // ❌ Quantity শূন্য হলে প্রোডাক্ট রিমুভ করো
      if (newQty <= 0) {
        delete newCart[id];
        setUniqueCount((prevCount) => Math.max(0, prevCount - 1)); // প্রোডাক্ট রিমুভ হলে কাউন্ট কমাও
      }
      // ✅ Quantity থাকলে শুধু আপডেট করো
      else {
        newCart[id] = newQty;
      }

      return newCart;
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[id]) {
        delete copy[id];
        setUniqueCount((prevCount) => Math.max(0, prevCount - 1)); // 🔹 রিমুভে কাউন্ট কমাও
      }
      return copy;
    });
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      const savedWishlist = localStorage.getItem("wishlist");
      const savedCount = localStorage.getItem("uniqueCount");

      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedCount) setUniqueCount(Number(savedCount));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      localStorage.setItem("uniqueCount", uniqueCount);
    }
  }, [cart, wishlist, uniqueCount]);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        wishlist,
        uniqueCount, // 🔹 নতুন count পাঠাও
        updateCart,
        removeFromCart,
        toggleWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
