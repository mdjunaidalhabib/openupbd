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
  const [checkoutQty, setCheckoutQty] = useState(initialQty);

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  useEffect(() => {
    apiFetch("/products")
      .then((data) => setAllProducts(data))
      .catch((err) => console.error("❌ Failed to load products", err))
      .finally(() => setProductsLoading(false));
  }, []);

  const cartItems = useMemo(() => {
    if (!allProducts.length) return [];

    if (productId) {
      const p = allProducts.find((x) => String(x._id) === String(productId));
      if (!p) return [];
      return [
        {
          productId: p._id,
          name: p.name,
          price: p.price,
          qty: checkoutQty,
          image: p.image,
          stock: p.stock,
        },
      ];
    }

    return Object.keys(cart)
      .map((id) => {
        const p = allProducts.find((x) => String(x._id) === String(id));
        if (!p) return null;
        return {
          productId: p._id,
          name: p.name,
          price: p.price,
          qty: cart[id],
          image: p.image,
          stock: p.stock,
        };
      })
      .filter(Boolean);
  }, [cart, productId, checkoutQty, allProducts]);

  const subtotal = calcSubtotal(cartItems);
  const deliveryCharge = 100;
  const [discount, setDiscount] = useState(0);
  const total = subtotal + deliveryCharge - discount;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  // ✅ Validation UI state
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const phoneValid = /^(01[3-9]\d{8})$/.test(phone);

  const errors = {
    name: !name.trim(),
    phone: !phone.trim() || !phoneValid,
    address: !address.trim(),
  };

  const fieldClass = (hasError) =>
    `mt-1 w-full p-2 border rounded-md outline-none transition
     ${
       hasError
         ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
         : "border-gray-300 focus:ring-2 focus:ring-green-200"
     }`;

  const labelClass = (hasError) =>
    `text-sm font-medium ${hasError ? "text-red-600" : "text-gray-900"}`;

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "habib10") {
      setDiscount(subtotal * 0.1);
      showToast("🎉 Promo code applied! 10% discount", "success");
    } else if (!promoCode) {
      showToast("⚠️ Promo code লিখুন!", "error");
    } else {
      showToast("🚫 Invalid promo code!", "error");
    }
  };

  // ✅ Button disable rule (required + loading + empty cart)
  const isOrderDisabled =
    productsLoading ||
    loading ||
    errors.name ||
    errors.phone ||
    errors.address ||
    !cartItems.length;

  async function placeOrder() {
    setSubmitted(true);

    // ✅ products loading guard
    if (productsLoading) {
      showToast("⏳ প্রোডাক্ট লোড হচ্ছে... একটু অপেক্ষা করুন", "error");
      return;
    }

    // ✅ validation guard
    if (errors.name || errors.phone || errors.address) {
      showToast("⚠️ সব ঘর ঠিকমতো পূরণ করতে হবে!", "error");
      return;
    }

    // ✅ empty cart guard
    if (!cartItems.length) {
      showToast("🛒 আপনার প্রোডাক্ট খালি", "error");
      return;
    }

    setLoading(true);

    const orderData = {
      items: cartItems,
      subtotal,
      deliveryCharge,
      discount,
      total,
      billing: { name, phone, address, note },
      promoCode,
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

      if (!productId) setCart({});

      const orderId = data._id || data.id || data.order?._id;
      if (!orderId) throw new Error("Order created but orderId missing");

      window.location.href = `/order-summary/${orderId}`;
    } catch (err) {
      console.error(err);
      showToast("🚨 সার্ভারে সংযোগ ব্যর্থ হয়েছে!", "error");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-bold text-green-700 text-center mb-6">
        অর্ডারটি সম্পন্ন করতে আপনার নাম, মোবাইল নাম্বার ও ঠিকানা লিখুন
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ✅ Billing Info (always visible) */}
        <div>
          {/* ✅ Name */}
          <label className="block mb-3">
            <span
              className={labelClass((submitted || touched.name) && errors.name)}
            >
              নাম *
            </span>
            <input
              type="text"
              value={name}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass((submitted || touched.name) && errors.name)}
            />
            {(submitted || touched.name) && errors.name && (
              <p className="text-xs text-red-600 mt-1">নাম লিখুন</p>
            )}
          </label>

          {/* ✅ Phone */}
          <label className="block mb-3">
            <span
              className={labelClass(
                (submitted || touched.phone) && errors.phone
              )}
            >
              মোবাইল *
            </span>
            <input
              type="tel"
              value={phone}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass(
                (submitted || touched.phone) && errors.phone
              )}
            />
            {(submitted || touched.phone) && errors.phone && (
              <p className="text-xs text-red-600 mt-1">
                সঠিক ১১ সংখ্যার নাম্বার দিন (01XXXXXXXXX)
              </p>
            )}
          </label>

          {/* ✅ Address */}
          <label className="block mb-3">
            <span
              className={labelClass(
                (submitted || touched.address) && errors.address
              )}
            >
              ঠিকানা *
            </span>
            <textarea
              value={address}
              rows="2"
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              onChange={(e) => setAddress(e.target.value)}
              className={fieldClass(
                (submitted || touched.address) && errors.address
              )}
            />
            {(submitted || touched.address) && errors.address && (
              <p className="text-xs text-red-600 mt-1">ঠিকানা লিখুন</p>
            )}
          </label>

          {/* Note */}
          <label className="block mb-3">
            <span className="text-sm font-medium">নোট (ঐচ্ছিক)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md border-gray-300"
              rows="2"
            />
          </label>

          {/* Payment */}
          <label className="block mb-3">
            <span className="text-sm font-medium">পেমেন্ট মেথড *</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md border-gray-300"
            >
              <option value="cod">Cash on Delivery</option>
              <option value="bkash">Bkash</option>
            </select>
          </label>
        </div>

        {/* ✅ Right Side Summary */}
        <div>
          {productsLoading ? (
            <CheckoutSummarySkeleton />
          ) : !cartItems.length ? (
            <p className="text-center text-gray-600">🛒 আপনার প্রোডাক্ট খালি</p>
          ) : (
            <>
              {cartItems.map((it) => (
                <div
                  key={it.productId}
                  className="flex items-center justify-between border p-3 rounded-lg mb-3"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <QuantityController
                        qty={it.qty}
                        stock={it.stock}
                        onChange={(change) =>
                          productId
                            ? setCheckoutQty((prev) =>
                                Math.min(Math.max(1, prev + change), it.stock)
                              )
                            : updateCart(it.productId, change, it.stock)
                        }
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">৳{it.price * it.qty}</p>
                    {!productId && (
                      <button
                        onClick={() => removeFromCart(it.productId)}
                        className="text-red-500 text-sm mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4 text-lg font-semibold">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between mt-2 text-lg font-semibold">
                <span>Delivery Charge</span>
                <span>৳{deliveryCharge}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between mt-2 text-lg font-semibold text-red-600">
                  <span>Discount</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between mt-2 text-lg font-bold text-green-700">
                <span>Total</span>
                <span>৳{total}</span>
              </div>

              <div className="flex items-center mt-4 gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 border rounded-md p-2 border-gray-300"
                />
                <button
                  onClick={applyPromo}
                  className="bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Apply
                </button>
              </div>

              {/* ✅ Button */}
              <div className="mt-6">
                <CheckoutButton
                  fullWidth
                  onClick={placeOrder}
                  loading={loading}
                  disabled={isOrderDisabled}
                />

                {isOrderDisabled && (
                  <p className="text-xs text-red-500 mt-2">
                    ⚠️ অর্ডার দিতে নাম, মোবাইল ও ঠিকানা সঠিকভাবে পূরণ করুন
                  </p>
                )}
              </div>
            </>
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
