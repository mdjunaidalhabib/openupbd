export default function HeaderSerialStatus({
  product,
  form,
  setForm,
  maxSerial,
}) {
  return (
    <>
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-indigo-600">
          {product ? "✏ পণ্য সম্পাদনা করুন" : "🛍️ নতুন পণ্য যোগ করুন"}
        </h1>
        <p className="text-sm text-gray-500">শপের জন্য প্রোডাক্ট তথ্য দিন</p>
      </div>

      {/* Serial + Status */}
      <section className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-gray-700">📌 Product Serial & Status</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Serial No
            </label>
            <select
              value={form.order}
              onChange={(e) =>
                setForm((p) => ({ ...p, order: Number(e.target.value) }))
              }
              className="border w-full p-2 rounded bg-white"
            >
              {Array.from({ length: maxSerial }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <select
              value={form.isActive ? "active" : "hidden"}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  isActive: e.target.value === "active",
                }))
              }
              className="border w-full p-2 rounded bg-white"
            >
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {!form.isActive && (
          <p className="text-xs text-red-600 mt-1">
            ⚠ এই প্রোডাক্ট Hidden — Public site-এ দেখাবে না।
          </p>
        )}
      </section>
    </>
  );
}
