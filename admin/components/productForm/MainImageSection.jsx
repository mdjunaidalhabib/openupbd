export default function MainImageSection({
  previewImage,
  mainDropRef,
  handleMainDrop,
  handleSingleImage,
  removeMainImage,
  errors, // ✅ NEW: errors prop
}) {
  const hasError = !!errors?.image;

  return (
    <section
      className={`bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 border space-y-3
        ${hasError ? "border-red-200" : "border-indigo-100"}
      `}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          🖼️ প্রধান ছবি
          {/* ✅ Required badge + star */}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1
              ${
                hasError
                  ? "text-red-600 bg-red-100"
                  : "text-indigo-600 bg-indigo-100"
              }
            `}
          >
            Required <span className="text-red-500">*</span>
          </span>
        </h2>

        {previewImage && (
          <button
            type="button"
            onClick={removeMainImage}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <div
        ref={mainDropRef}
        onDrop={handleMainDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => mainDropRef.current?.querySelector("input")?.click()}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed 
          ${previewImage ? "bg-white" : "bg-indigo-50/40"}
          ${
            hasError
              ? "border-red-500 bg-red-50/40 hover:border-red-600"
              : previewImage
              ? "border-indigo-300 hover:border-indigo-400"
              : "border-indigo-200 hover:border-indigo-400"
          }
          p-5 flex flex-col sm:flex-row items-center gap-5 cursor-pointer
          hover:bg-white transition`}
      >
        <div className="relative">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Main preview"
              className="h-32 w-32 rounded-xl object-cover shadow-md ring-1 ring-indigo-100"
            />
          ) : (
            <div className="h-32 w-32 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-indigo-100">
              <div className="text-center text-gray-400">
                <div className="text-3xl">📷</div>
                <div className="text-xs mt-1">No image</div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 rounded-xl bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
            Click / Drop
          </div>
        </div>

        <div className="flex-1 space-y-1 text-center sm:text-left">
          <p
            className={`font-semibold ${
              hasError ? "text-red-700" : "text-gray-700"
            }`}
          >
            ছবি ড্র্যাগ করে এখানে ছাড়ুন
          </p>
          <p className="text-sm text-gray-500">
            অথবা ক্লিক করে ফাইল সিলেক্ট করুন
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WEBP • Max 5MB • Recommended 1:1
          </p>

          {/* ✅ Error hint */}
          {hasError && (
            <p className="text-xs text-red-600 font-medium mt-1">
              প্রধান ছবি দেওয়া বাধ্যতামূলক!
            </p>
          )}

          <div
            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm
              ${hasError ? "bg-red-600 text-white" : "bg-indigo-600 text-white"}
            `}
          >
            ⬆ Upload Image
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSingleImage}
        />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-200/40 rounded-full blur-2xl" />
      </div>
    </section>
  );
}
