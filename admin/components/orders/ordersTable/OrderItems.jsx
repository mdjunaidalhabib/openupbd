export default function OrderItems({ items = [] }) {
  return (
    <td className="p-3 align-top w-[340px]">
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-xl border bg-white p-2"
          >
            <img
              src={it.image || "/placeholder.png"}
              alt={it.name}
              className="w-10 h-10 rounded-lg border"
            />

            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{it.name}</p>
              <p className="text-xs text-gray-500">
                Qty: {it.qty} • ৳{it.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </td>
  );
}
