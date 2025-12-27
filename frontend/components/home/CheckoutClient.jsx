"use client";

import { useUser } from "../../context/UserContext";
import { apiFetch } from "../../utils/api";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCartUtils } from "../../hooks/useCartUtils";
import QuantityController from "./QuantityController";
import CheckoutButton from "./CheckoutButton";
import Toast from "./Toast";
import CheckoutSummarySkeleton from "../skeletons/CheckoutSummarySkeleton";

export default function CheckoutPage() {
  const { me } = useUser();
  const { cart, setCart, updateCart, removeFromCart, calcSubtotal } =
    useCartUtils();

  const searchParams = useSearchParams();

  const productId = searchParams.get("productId");
  const initialQty = Number(searchParams.get("qty")) || 1;

  // ✅ stock from URL (from ProductDetails)
  const stockFromUrl = Number(searchParams.get("stock"));
  const hasStockFromUrl = Number.isFinite(stockFromUrl);

  // ✅ URL থেকে color decode করা
  const selectedColorNameRaw = searchParams.get("color");
  const selectedColorName = selectedColorNameRaw
    ? decodeURIComponent(selectedColorNameRaw)
    : null;

  // ✅ cart checkout items payload from URL
  const itemsRaw = searchParams.get("items");
  const decodedItems = useMemo(() => {
    if (!itemsRaw) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(itemsRaw));
      if (!Array.isArray(parsed)) return null;

      return parsed
        .map((it) => ({
          productId: it?.productId ? String(it.productId) : "",
          qty: Number(it?.qty || 0),
          color: it?.color ? String(it.color) : null,
          stock: it?.stock !== undefined ? Number(it.stock) : undefined,
        }))
        .filter((it) => it.productId && it.qty > 0);
    } catch (e) {
      return null;
    }
  }, [itemsRaw]);

  // ✅ Buy now qty state
  const [checkoutQty, setCheckoutQty] = useState(initialQty);

  // ✅ decodedItems কে state বানালাম (checkout payload mode fix)
  const [checkoutItems, setCheckoutItems] = useState([]);

  // ✅ local qty map (Cart → Checkout এ qty change করলে UI update হবে)
  const [localQtyMap, setLocalQtyMap] = useState({});

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  // ✅ Payment Method (COD default)
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // ✅ Delivery Charge from DB (public api)
  const [deliveryCharge, setDeliveryCharge] = useState(120);
  const [deliveryLoading, setDeliveryLoading] = useState(true);

  const [toast, setToast] = useState({ message: "", type: "" });
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // ✅ products load
  useEffect(() => {
    apiFetch("/products")
      .then((data) => setAllProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ Failed to load products", err))
      .finally(() => setProductsLoading(false));
  }, []);

  // ✅ decodedItems -> state set
  useEffect(() => {
    if (decodedItems && decodedItems.length > 0) {
      setCheckoutItems(decodedItems);
    } else {
      setCheckoutItems([]);
    }
  }, [decodedItems]);

  // ✅ Delivery charge load from DB
  useEffect(() => {
    apiFetch("/delivery-fee")
      .then((data) => {
        const fee = Number(data?.fee);
        setDeliveryCharge(Number.isFinite(fee) ? fee : 120);
      })
      .catch((err) => {
        console.error("❌ Failed to load delivery fee", err);
        setDeliveryCharge(120); // fallback
      })
      .finally(() => setDeliveryLoading(false));
  }, []);

  // ✅ helper: safe number
  const toNumber = (val, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  // ✅ helper: robust variant match by name
  const findVariantByName = (product, colorName) => {
    if (!colorName) return null;
    const colors = Array.isArray(product?.colors) ? product.colors : [];
    const target = String(colorName).trim().toLowerCase();
    return (
      colors.find(
        (c) =>
          String(c?.name || "")
            .trim()
            .toLowerCase() === target
      ) || null
    );
  };

  // ✅ helper: parse cart key (productId|color)
  const parseCartKey = (key) => {
    const [pid, color] = String(key).split("|");
    return { productId: String(pid), color: color ? String(color) : null };
  };

  const cartItems = useMemo(() => {
    if (!allProducts.length) return [];

    // ✅ MODE 1: ITEMS PAYLOAD CHECKOUT (state based)
    if (checkoutItems && checkoutItems.length > 0) {
      return checkoutItems
        .map((it) => {
          const p = allProducts.find(
            (x) => String(x._id) === String(it.productId)
          );
          if (!p) return null;

          const variant = findVariantByName(p, it.color);

          // ✅ stock: payload stock > variant > product
          const stock = Number.isFinite(Number(it.stock))
            ? Number(it.stock)
            : variant
            ? toNumber(variant.stock, 0)
            : toNumber(p.stock, 0);

          const image =
            variant?.images?.[0] ||
            p.image ||
            (Array.isArray(p.images) ? p.images[0] : null) ||
            "/no-image.png";

          return {
            key: `${p._id}_${variant?.name || "default"}`,
            cartKey: it.color ? `${p._id}|${it.color}` : String(p._id),
            productId: p._id,
            name: p.name,
            price: toNumber(p.price, 0),
            qty: toNumber(it.qty, 1),
            image,
            stock,
            color: it.color || null,
          };
        })
        .filter(Boolean);
    }

    // ✅ MODE 2: SINGLE PRODUCT CHECKOUT (Buy Now)
    if (productId) {
      const p = allProducts.find((x) => String(x._id) === String(productId));
      if (!p) return [];

      const variant = findVariantByName(p, selectedColorName);

      const stock =
        hasStockFromUrl && stockFromUrl > 0
          ? stockFromUrl
          : variant
          ? toNumber(variant.stock, 0)
          : toNumber(p.stock, 0);

      const image =
        variant?.images?.[0] ||
        p.image ||
        (Array.isArray(p.images) ? p.images[0] : null) ||
        "/no-image.png";

      return [
        {
          key: `${p._id}_${variant?.name || "default"}`,
          cartKey: selectedColorName
            ? `${p._id}|${selectedColorName}`
            : String(p._id),
          productId: p._id,
          name: p.name,
          price: toNumber(p.price, 0),
          qty: toNumber(checkoutQty, 1),
          image,
          stock,
          color: selectedColorName || null,
        },
      ];
    }

    // ✅ MODE 3: CART CHECKOUT (fallback)
    return Object.keys(cart)
      .map((key) => {
        const { productId: pid, color } = parseCartKey(key);

        const p = allProducts.find((x) => String(x._id) === String(pid));
        if (!p) return null;

        const variant = findVariantByName(p, color);

        const stock = variant
          ? toNumber(variant.stock, 0)
          : toNumber(p.stock, 0);

        const image =
          variant?.images?.[0] ||
          p.image ||
          (Array.isArray(p.images) ? p.images[0] : null) ||
          "/no-image.png";

        const qty = toNumber(localQtyMap[key] ?? cart[key], 0);

        return {
          key: `${p._id}_${variant?.name || "default"}`,
          cartKey: String(key),
          productId: p._id,
          name: p.name,
          price: toNumber(p.price, 0),
          qty,
          image,
          stock,
          color: color || null,
        };
      })
      .filter(Boolean);
  }, [
    cart,
    productId,
    checkoutQty,
    allProducts,
    selectedColorName,
    hasStockFromUrl,
    stockFromUrl,
    localQtyMap,
    checkoutItems,
  ]);

  // ✅ checkout items payload (for CheckoutButton)
  const checkoutItemsPayload = useMemo(() => {
    return cartItems
      .map((it) => ({
        productId: String(it.productId),
        qty: Number(it.qty || 0),
        color: it.color || null,
        stock: Number(it.stock || 0),
      }))
      .filter((it) => it.productId && it.qty > 0);
  }, [cartItems]);

  const subtotal = calcSubtotal(cartItems);
  const total = subtotal + deliveryCharge;

  const phoneValid = /^(01[3-9]\d{8})$/.test(phone);
  const errors = {
    name: !name.trim(),
    phone: !phone.trim() || !phoneValid,
    address: !address.trim(),
  };

  const fieldClass = (hasError) =>
    `mt-1 w-full p-2 border rounded-md outline-none transition ${
      hasError
        ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 focus:ring-2 focus:ring-pink-200"
    }`;

  // ✅ out-of-stock check
  const anyOutOfStock = useMemo(() => {
    return cartItems.some(
      (it) =>
        toNumber(it.stock, 0) <= 0 ||
        toNumber(it.qty, 0) > toNumber(it.stock, 0)
    );
  }, [cartItems]);

  async function placeOrder() {
    setSubmitted(true);

    if (errors.name || errors.phone || errors.address || !cartItems.length) {
      showToast("⚠️ সঠিক তথ্য প্রদান করুন!", "error");
      return;
    }

    if (anyOutOfStock) {
      showToast("⚠️ স্টক শেষ! দয়া করে qty কমিয়ে আবার চেষ্টা করুন।", "error");
      return;
    }

    setLoadingOrder(true);

    const orderData = {
      items: cartItems,
      subtotal,
      deliveryCharge,
      total,
      billing: { name, phone, address, note },
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      userId: me?.userId || null,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      // ✅ Clear correct cart keys
      if (productId || (checkoutItems && checkoutItems.length > 0)) {
        cartItems.forEach((it) => {
          if (it.cartKey) removeFromCart(String(it.cartKey));
        });
      } else {
        setCart({});
      }

      const orderId = data._id || data.id;

      // ✅ Pay Now → bKash Redirect
      if (paymentMethod === "paynow") {
        window.location.href = `/bkash-payment?orderId=${orderId}&amount=${total}`;
        return;
      }

      // ✅ COD → Order Summary Redirect
      window.location.href = `/order-summary/${orderId}`;
    } catch (err) {
      showToast("🚨 অর্ডার সম্পন্ন হয়নি!", "error");
      setLoadingOrder(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white shadow-md rounded-lg mt-6 font-sans">
      <h2 className="text-xl font-bold text-pink-600 text-center mb-6 underline decoration-pink-200 underline-offset-8">
        অর্ডার সম্পন্ন করুন
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">নাম *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={fieldClass((submitted || touched.name) && errors.name)}
              placeholder="আপনার নাম"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              মোবাইল নম্বর *
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              className={fieldClass(
                (submitted || touched.phone) && errors.phone
              )}
              placeholder="01XXXXXXXXX"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              পূর্ণাঙ্গ ঠিকানা *
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              className={fieldClass(
                (submitted || touched.address) && errors.address
              )}
              placeholder="বাসা নং, রোড, এলাকা ও জেলা লিখুন"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              নোট (ঐচ্ছিক)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md border-gray-300 outline-none text-sm focus:border-pink-300"
              placeholder="যেমন: ডেলিভারি সময় বা অন্য কিছু..."
            />
          </label>

          {/* ✅ Payment Options (COD default + Pay Now) */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              পেমেন্ট মেথড সিলেক্ট করুন *
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === "cod"
                    ? "bg-pink-600 text-white border-pink-600 shadow-lg scale-105"
                    : "bg-white text-gray-700 border-gray-300 hover:border-pink-300"
                }`}
              >
                Cash on Delivery
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("paynow")}
                className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === "paynow"
                    ? "bg-pink-600 text-white border-pink-600 shadow-lg scale-105"
                    : "bg-white text-gray-700 border-gray-300 hover:border-pink-300"
                }`}
              >
                Pay Now
              </button>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700 text-xs font-medium">
              🚚 ডেলিভারি চার্জ:{" "}
              <b>{deliveryLoading ? "Loading..." : `৳${deliveryCharge}`}</b>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit sticky top-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-5 pb-2 border-b text-lg">
            অর্ডার সামারি
          </h3>

          {productsLoading ? (
            <CheckoutSummarySkeleton />
          ) : (
            <div className="space-y-5">
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {cartItems.map((it) => (
                  <div
                    key={it.key}
                    className="flex justify-between items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={it.image}
                          className="w-14 h-14 object-cover rounded-md border"
                          alt={it.name}
                        />
                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
                          {it.qty}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-gray-700 line-clamp-1 leading-tight">
                          {it.name}
                        </span>

                        {it.color && (
                          <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded w-fit border border-pink-100 font-bold uppercase">
                            Color: {it.color}
                          </span>
                        )}

                        <div className="transform scale-90 origin-left mt-1">
                          <QuantityController
                            qty={it.qty}
                            stock={it.stock}
                            onChange={(change) => {
                              // ✅ MODE 1: items payload checkout
                              if (checkoutItems && checkoutItems.length > 0) {
                                setCheckoutItems((prev) =>
                                  prev.map((x) => {
                                    const sameProduct =
                                      String(x.productId) ===
                                      String(it.productId);
                                    const sameColor =
                                      String(x.color || "") ===
                                      String(it.color || "");

                                    if (sameProduct && sameColor) {
                                      const nextQty = Math.min(
                                        Math.max(1, Number(x.qty) + change),
                                        toNumber(it.stock, 0)
                                      );
                                      return { ...x, qty: nextQty };
                                    }
                                    return x;
                                  })
                                );
                                return;
                              }

                              // ✅ MODE 2: Buy Now
                              if (productId) {
                                setCheckoutQty((prev) => {
                                  const next = prev + change;
                                  return Math.min(
                                    Math.max(1, next),
                                    toNumber(it.stock, 0)
                                  );
                                });
                                return;
                              }

                              // ✅ MODE 3: Cart Checkout
                              const key = String(it.cartKey || it.productId);

                              const current = toNumber(
                                localQtyMap[key] ?? it.qty,
                                1
                              );
                              const next = Math.min(
                                Math.max(1, current + change),
                                toNumber(it.stock, 0)
                              );

                              if (next === current) return;

                              setLocalQtyMap((prev) => ({
                                ...prev,
                                [key]: next,
                              }));

                              updateCart(key, next - current, it.stock);
                            }}
                          />
                        </div>

                        {toNumber(it.stock, 0) <= 0 && (
                          <span className="text-[10px] font-bold text-red-500">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-center">
                      <span className="text-sm font-bold text-gray-800 block">
                        ৳{toNumber(it.price, 0) * toNumber(it.qty, 0)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {it.price} x {it.qty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-4 space-y-2.5 text-sm font-sans">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল:</span>
                  <span className="font-medium">৳{subtotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-medium text-gray-800">
                    {deliveryLoading ? "Loading..." : `৳${deliveryCharge}`}
                  </span>
                </div>

                <div className="flex justify-between text-xl font-extrabold text-pink-600 border-t pt-3 mt-2">
                  <span>মোট খরচ:</span>
                  <span>৳{total}</span>
                </div>
              </div>

              <div className="space-y-3">
                <CheckoutButton
                  fullWidth
                  onClick={placeOrder}
                  loading={loadingOrder}
                  checkoutItems={checkoutItemsPayload}
                  disabled={
                    productsLoading ||
                    deliveryLoading ||
                    loadingOrder ||
                    cartItems.length === 0 ||
                    anyOutOfStock
                  }
                  label={
                    anyOutOfStock
                      ? "Out of Stock Items!"
                      : paymentMethod === "paynow"
                      ? "Payment with bKash"
                      : "Confirm Order"
                  }
                />

                <div className="bg-yellow-50 p-2 rounded-lg text-[10px] text-yellow-700 text-center flex items-center justify-center gap-1">
                  <span>🔒</span> আপনার তথ্য আমাদের কাছে নিরাপদ।
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />
    </div>
  );
}
