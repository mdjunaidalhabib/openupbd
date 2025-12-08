export default function ReviewsSection({
  form,
  addReview,
  handleReviewChange,
  removeReview,
}) {
  return (
    <section className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-700">⭐ গ্রাহক রিভিউ</h2>
        <button
          type="button"
          onClick={addReview}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          + নতুন রিভিউ যোগ করুন
        </button>
      </div>

      {form.reviews.length === 0 && (
        <p className="text-sm text-gray-500">এখনও কোনো রিভিউ নেই</p>
      )}

      {form.reviews.map((r, idx) => (
        <div key={idx} className="bg-white border rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sm text-gray-700">
              রিভিউ #{idx + 1}
            </p>
            <button
              type="button"
              onClick={() => removeReview(idx)}
              className="text-xs text-red-600 hover:underline"
            >
              🗑 মুছুন
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold">নাম</label>
            <input
              className="mt-1 w-full border rounded-lg p-2"
              value={r.user}
              onChange={(e) => handleReviewChange(idx, "user", e.target.value)}
              placeholder="Customer name"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">রেটিং (০–৫)</label>
            <input
              type="number"
              min="0"
              max="5"
              className="mt-1 w-full border rounded-lg p-2"
              value={r.rating}
              onChange={(e) =>
                handleReviewChange(idx, "rating", e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold">মন্তব্য</label>
            <textarea
              className="mt-1 w-full border rounded-lg p-2 min-h-[60px]"
              value={r.comment}
              onChange={(e) =>
                handleReviewChange(idx, "comment", e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </section>
  );
}
