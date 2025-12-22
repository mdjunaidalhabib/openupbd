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
  const selectedColorName = searchParams.get("color"); // ✅ URL থেকে কালার নেওয়া হচ্ছে
  const [checkoutQty, setCheckoutQty] = useState(initialQty);

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  // ✅ ডিফল্টভাবে 'free' সেট করা হয়েছে
  const [paymentMethod, setPaymentMethod] = useState("free");

  // Delivery States
  const [deliveryArea, setDeliveryArea] = useState("inside");
  // ✅ ডিফল্টভাবে চার্জ 0 সেট করা হয়েছে (যেহেতু ডিফল্ট free)
  const [deliveryCharge, setDeliveryCharge] = useState(0);

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

  useEffect(() => {
    apiFetch("/products")
      .then((data) => setAllProducts(data))
      .catch((err) => console.error("❌ Failed to load products", err))
      .finally(() => setProductsLoading(false));
  }, []);

  // ✅ লজিক: পেমেন্ট মেথড বা এরিয়া পরিবর্তন হলে চার্জ আপডেট
  useEffect(() => {
    if (paymentMethod === "free") {
      setDeliveryCharge(0);
    } else {
      setDeliveryCharge(deliveryArea === "inside" ? 60 : 120);
    }
  }, [paymentMethod, deliveryArea]);

  const cartItems = useMemo(() => {
    if (!allProducts.length) return [];

    // ১. যদি সিঙ্গেল প্রোডাক্ট চেকআউট হয় (Buy Now)
    if (productId) {
      const p = allProducts.find((x) => String(x._id) === String(productId));
      if (!p) return [];

      // কালার অবজেক্ট খুঁজে বের করা
      const variant = p.colors?.find((c) => c.name === selectedColorName);

      return [
        {
          productId: p._id,
          name: p.name,
          price: p.price,
          qty: checkoutQty,
          image: variant?.images?.[0] || p.image || p.images?.[0], // কালারের ছবি থাকলে সেটা দেখাবে
          stock: variant ? variant.stock : p.stock,
          color: selectedColorName || null, // কালার সেভ হচ্ছে
        },
      ];
    }

    // ২. যদি কার্ট থেকে চেকআউট হয়
    return Object.keys(cart)
      .map((id) => {
        const p = allProducts.find((x) => String(x._id) === String(id));
        if (!p) return null;
        return {
          productId: p._id,
          name: p.name,
          price: p.price,
          qty: cart[id],
          image: p.image || p.images?.[0],
          stock: p.stock,
          color: null, // কার্টে সাধারণত ডিফল্ট থাকে
        };
      })
      .filter(Boolean);
  }, [cart, productId, checkoutQty, allProducts, selectedColorName]);

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

  async function placeOrder() {
    setSubmitted(true);
    if (errors.name || errors.phone || errors.address || !cartItems.length) {
      showToast("⚠️ সঠিক তথ্য প্রদান করুন!", "error");
      return;
    }

    setLoadingOrder(true);
    const orderData = {
      items: cartItems,
      subtotal,
      deliveryCharge,
      total,
      billing: { name, phone, address, note, deliveryArea },
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

      if (productId) {
        removeFromCart(String(productId));
      } else {
        setCart({});
      }

      window.location.href = `/order-summary/${data._id || data.id}`;
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

          {/* ✅ পেমেন্ট মেথড সিলেক্ট */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              ডেলিভারি মেথড সিলেক্ট করুন *
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("free")}
                className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === "free"
                    ? "bg-pink-600 text-white border-pink-600 shadow-lg scale-105"
                    : "bg-white text-gray-700 border-gray-300 hover:border-pink-300"
                }`}
              >
                Free Delivery
              </button>
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
            </div>
          </div>

          {/* ✅ শর্তাধীন ডেলিভারি এরিয়া (শুধুমাত্র COD হলে দেখাবে) */}
          {paymentMethod === "cod" && (
            <div className="p-4 bg-pink-50 border border-pink-100 rounded-xl animate-in fade-in zoom-in duration-300">
              <p className="text-xs font-bold mb-3 text-pink-700 uppercase tracking-wider">
                শিপিং এরিয়া (কুরিয়ার চার্জ) *
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryArea("inside")}
                  className={`flex-1 py-2.5 border rounded-lg text-xs font-semibold transition-all ${
                    deliveryArea === "inside"
                      ? "bg-white border-pink-600 text-pink-600 ring-2 ring-pink-200 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  ঢাকার ভিতরে (৳৬০)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryArea("outside")}
                  className={`flex-1 py-2.5 border rounded-lg text-xs font-semibold transition-all ${
                    deliveryArea === "outside"
                      ? "bg-white border-pink-600 text-pink-600 ring-2 ring-pink-200 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  ঢাকার বাইরে (৳১২০)
                </button>
              </div>
            </div>
          )}

          {paymentMethod === "free" && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-xs font-medium flex items-center gap-2 animate-pulse">
              <span>🎉</span> অভিনন্দন! আপনি আমাদের ফ্রি ডেলিভারি অফারটি
              পাচ্ছেন।
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit sticky top-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-5 pb-2 border-b text-lg">
            অর্ডার সামারি
          </h3>
          {productsLoading ? (
            <CheckoutSummarySkeleton />
          ) : (
            <div className="space-y-5">
              {/* প্রোডাক্ট লিস্ট */}
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {cartItems.map((it) => (
                  <div
                    key={it.productId}
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
                        {/* ✅ কালার ট্যাগ প্রদর্শন */}
                        {it.color && (
                          <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded w-fit border border-pink-100 font-bold uppercase">
                            Color: {it.color}
                          </span>
                        )}

                        <div className="transform scale-90 origin-left mt-1">
                          <QuantityController
                            qty={it.qty}
                            stock={it.stock}
                            onChange={(change) =>
                              productId
                                ? setCheckoutQty((prev) =>
                                    Math.min(
                                      Math.max(1, prev + change),
                                      it.stock
                                    )
                                  )
                                : updateCart(it.productId, change, it.stock)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-center">
                      <span className="text-sm font-bold text-gray-800 block">
                        ৳{it.price * it.qty}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {it.price} x {it.qty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ক্যালকুলেশন পার্ট */}
              <div className="border-t border-dashed pt-4 space-y-2.5 text-sm font-sans">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল:</span>
                  <span className="font-medium">৳{subtotal}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>শিপিং চার্জ:</span>
                  <span
                    className={
                      deliveryCharge === 0
                        ? "text-green-600 font-bold"
                        : "font-medium text-gray-800"
                    }
                  >
                    {deliveryCharge === 0 ? "ফ্রি" : `৳${deliveryCharge}`}
                  </span>
                </div>

                {/* ফাইনাল টোটাল */}
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
                  disabled={
                    productsLoading || loadingOrder || cartItems.length === 0
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
