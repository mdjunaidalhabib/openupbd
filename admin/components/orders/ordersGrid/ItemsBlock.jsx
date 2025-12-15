export default function ItemsBlock({ items = [] }) {
  const firstTwo = items.slice(0, 2);
  const moreCount = items.length - firstTwo.length;

  return (
    <div className="col-span-7 rounded-md bg-gray-50 p-2">
      <div className="flex justify-between text-[11px] font-bold mb-1">
        <span>Items</span>
        <span className="text-gray-500">
          {firstTwo.length}/{items.length}
        </span>
      </div>

      <div className="space-y-2">
        {firstTwo.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border bg-white p-2"
          >
            <img
              src={it.image || "/placeholder.png"}
              className="w-9 h-9 rounded-md border"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate">{it.name}</p>
              <p className="text-[10px] text-gray-500">
                Qty: {it.qty} • ৳{it.price}
              </p>
            </div>
          </div>
        ))}
      </div>

      {moreCount > 0 && (
        <div className="mt-1 text-[10px] text-gray-500">
          +{moreCount} more items
        </div>
      )}
    </div>
  );
}
