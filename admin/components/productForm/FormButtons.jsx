export default function FormButtons({ processing, product, onClose }) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={processing}
        className={`w-full py-3 rounded-xl text-white font-semibold shadow-sm transition ${
          processing
            ? "bg-gray-400"
            : "bg-gradient-to-r from-green-500 to-lime-500 hover:scale-[1.01]"
        }`}
      >
        {processing
          ? product
            ? "আপডেট হচ্ছে..."
            : "সংরক্ষণ হচ্ছে..."
          : product
          ? "💾 আপডেট করুন"
          : "💾 সংরক্ষণ করুন"}
      </button>

      <button
        type="button"
        onClick={onClose}
        disabled={processing}
        className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium"
      >
        ✖ বাতিল
      </button>
    </div>
  );
}
