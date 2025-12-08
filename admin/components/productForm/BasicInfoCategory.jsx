export default function BasicInfoCategory({
  form,
  setForm,
  categories,
  selectedCatObj,
  errors,
  setErrors,
}) {
  // ✅ shared input classes (Name field focus style everywhere)
  const baseInput =
    "mt-1 w-full px-3 py-2 rounded-lg border transition focus:outline-none";
  const normalFocus =
    "border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";
  const errorFocus =
    "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-300";

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* ✅ NAME (Required) */}
        <div>
          <label className="font-semibold text-gray-700">
            নাম <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, name: v }));

              // ✅ typing করলে error remove
              if (v.trim()) {
                setErrors?.((prev) => ({ ...prev, name: false }));
              }
            }}
            placeholder="প্রোডাক্ট নাম লিখুন"
            className={`${baseInput} ${
              errors?.name ? errorFocus : normalFocus
            }`}
          />
          {errors?.name && (
            <p className="text-xs text-red-600 mt-1">নাম দেওয়া বাধ্যতামূলক!</p>
          )}
        </div>

        {/* ✅ PRICE (Required) */}
        <div>
          <label className="font-semibold text-gray-700">
            দাম <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, price: v }));

              // ✅ typing করলে error remove
              if (v && Number(v) > 0) {
                setErrors?.((prev) => ({ ...prev, price: false }));
              }
            }}
            placeholder="দাম লিখুন"
            className={`${baseInput} ${
              errors?.price ? errorFocus : normalFocus
            }`}
          />
          {errors?.price && (
            <p className="text-xs text-red-600 mt-1">দাম দেওয়া বাধ্যতামূলক!</p>
          )}
        </div>

        {/* OLD PRICE */}
        <div>
          <label className="font-semibold text-gray-700">পুরাতন দাম</label>
          <input
            type="number"
            value={form.oldPrice}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, oldPrice: v }));
            }}
            placeholder="পুরাতন দাম"
            className={`${baseInput} ${normalFocus}`}
          />
        </div>

        {/* STOCK */}
        <div>
          <label className="font-semibold text-gray-700">স্টক</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, stock: v }));
            }}
            placeholder="স্টক সংখ্যা"
            className={`${baseInput} ${normalFocus}`}
          />
        </div>

        {/* ✅ CATEGORY (Required) */}
        <div>
          <label className="font-semibold text-gray-700">
            ক্যাটাগরি <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, category: v }));

              // ✅ select করলেই error remove
              if (v) {
                setErrors?.((prev) => ({ ...prev, category: false }));
              }
            }}
            className={`${baseInput} ${
              errors?.category ? errorFocus : normalFocus
            }`}
          >
            <option value="">ক্যাটাগরি নির্বাচন করুন</option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {selectedCatObj && (
            <p className="text-xs text-gray-500 mt-1">
              নির্বাচিত ক্যাটাগরি: {selectedCatObj.name}
            </p>
          )}

          {errors?.category && (
            <p className="text-xs text-red-600 mt-1">
              ক্যাটাগরি নির্বাচন করা বাধ্যতামূলক!
            </p>
          )}
        </div>

        {/* RATING (Auto) */}
        <div>
          <label className="font-semibold text-gray-700">রেটিং (Auto)</label>
          <input
            type="number"
            value={form.rating}
            disabled
            className={`${baseInput} border-gray-300 bg-gray-100`}
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="font-semibold text-gray-700">বর্ণনা</label>
        <textarea
          value={form.description}
          onChange={(e) => {
            const v = e.target.value;
            setForm((prev) => ({ ...prev, description: v }));
          }}
          placeholder="প্রোডাক্ট বর্ণনা লিখুন"
          rows={3}
          className={`${baseInput} ${normalFocus}`}
        />
      </div>

      {/* ADDITIONAL INFO */}
      <div>
        <label className="font-semibold text-gray-700">অতিরিক্ত তথ্য</label>
        <textarea
          value={form.additionalInfo}
          onChange={(e) => {
            const v = e.target.value;
            setForm((prev) => ({ ...prev, additionalInfo: v }));
          }}
          placeholder="অতিরিক্ত তথ্য লিখুন"
          rows={3}
          className={`${baseInput} ${normalFocus}`}
        />
      </div>
    </section>
  );
}
