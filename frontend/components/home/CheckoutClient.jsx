"use client";
import { useUser } from "../../context/UserContext";
import { apiFetch } from "../../utils/api";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCartUtils } from "../../hooks/useCartUtils";
import QuantityController from "./QuantityController";
import CheckoutButton from "./CheckoutButton";
import Toast from "./Toast";

export default function CheckoutPage() {
  const { me } = useUser();
  const { cart, setCart, updateCart, removeFromCart, calcSubtotal } = useCartUtils();
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
    apiFetch("/api/products")
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
        { productId: p._id, name: p.name, price: p.price, qty: checkoutQty, image: p.image, stock: p.stock },
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

  async function placeOrder() {
    if (!name || !phone || !address) return showToast("⚠️ সব ঘর পূরণ করতে হবে!", "error");
    if (!/^(01[3-9]\d{8})$/.test(phone)) return showToast("📞 সঠিক ১১ সংখ্যার নাম্বার দিন", "error");

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      if (!productId) setCart({});
      showToast("✅ অর্ডার সফলভাবে সম্পন্ন হয়েছে!", "success");

      setTimeout(() => {
        window.location.href = `/order-summary/${data._id || data.id || data.order?._id}`;
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("🚨 সার্ভারে সংযোগ ব্যর্থ হয়েছে!", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-bold text-green-700 text-center mb-6">
        অর্ডারটি সম্পন্ন করতে আপনার নাম, মোবাইল নাম্বার ও ঠিকানা লিখুন
      </h2>

      {productsLoading ? (
        <p className="text-center text-gray-600">⏳ প্রোডাক্ট লোড হচ্ছে...</p>
      ) : !cartItems.length ? (
        <p className="text-center text-gray-600">🛒 আপনার কার্ট খালি</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Billing Info */}
          <div>
            <label className="block mb-3">
              <span className="text-sm font-medium">নাম *</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium">মোবাইল *</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium">ঠিকানা *</span>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full p-2 border rounded-md" rows="2" />
            </label>
            <label className="block mb-3">
              <span className="text-sm font-medium">নোট (ঐচ্ছিক)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full p-2 border rounded-md" rows="2" />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium">পেমেন্ট মেথড *</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full p-2 border rounded-md">
                <option value="cod">Cash on Delivery</option>
                <option value="bkash">Bkash</option>
              </select>
            </label>
          </div>

          {/* Cart Summary */}
          <div>
            {cartItems.map((it) => (
              <div key={it.productId} className="flex items-center justify-between border p-3 rounded-lg mb-3">
                <div className="flex items-center space-x-3">
                  <img src={it.image} alt={it.name} className="w-16 h-16 rounded-md object-cover" />
                  <div>
                    <p className="font-medium">{it.name}</p>
                    <QuantityController
                      qty={it.qty}
                      stock={it.stock}
                      onChange={(change) =>
                        productId
                          ? setCheckoutQty((prev) => Math.min(Math.max(1, prev + change), it.stock))
                          : updateCart(it.productId, change, it.stock)
                      }
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">৳{it.price * it.qty}</p>
                  {!productId && (
                    <button onClick={() => removeFromCart(it.productId)} className="text-red-500 text-sm mt-1">
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
              <input type="text" placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 border rounded-md p-2" />
              <button onClick={applyPromo} className="bg-green-600 text-white px-4 py-2 rounded-md">Apply</button>
            </div>

            <div className="mt-6">
              <CheckoutButton
                product={cartItems[0]}
                productId={productId}
                qty={productId ? checkoutQty : 1}
                total={total}
                fullWidth
                onClick={placeOrder}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
    </div>
  );
}
