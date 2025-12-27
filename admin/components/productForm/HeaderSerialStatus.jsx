export default function HeaderSerialStatus({
  product,
  form,
  setForm,
  maxSerial, // এটি সাধারণত বর্তমান প্রোডাক্ট সংখ্যা (productsLength)
}) {
  // নতুন প্রোডাক্টের জন্য ড্রপডাউন লিস্ট ১ থেকে (maxSerial + 1) পর্যন্ত হওয়া উচিত
  // এডিট মোডে বর্তমান সংখ্যা পর্যন্ত থাকলেই হবে
  const totalOptions = product ? maxSerial : maxSerial + 1;

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-indigo-600">
          {product ? "✏ Edit Product" : "🛍 Add Product"}
        </h1>
      </div>

      <div className="bg-gray-50 rounded p-4 grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-sm font-semibold block mb-1">Serial</label>
          <select
            value={form.order}
            onChange={(e) =>
              setForm((p) => ({ ...p, order: Number(e.target.value) }))
            }
            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none bg-white transition-all"
          >
            {Array.from({ length: totalOptions }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 mt-1">
            {product ? "Current position" : "Automatically set to last"}
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">Status</label>
          <select
            value={form.isActive ? "active" : "hidden"}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                isActive: e.target.value === "active",
              }))
            }
            className={`w-full border p-2.5 rounded-lg focus:ring-2 outline-none transition-all ${
              form.isActive
                ? "border-green-200 bg-green-50 text-green-700 focus:ring-green-100"
                : "border-red-200 bg-red-50 text-red-700 focus:ring-red-100"
            }`}
          >
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
    </>
  );
}
