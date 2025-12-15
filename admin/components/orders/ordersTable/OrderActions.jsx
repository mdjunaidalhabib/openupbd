export default function OrderActions({
  order,
  onEdit,
  onDelete,
  onSendCourier,
}) {
  const locked = order.status === "delivered" || order.status === "cancelled";

  const canSendCourier =
    order.status === "ready_to_delivery" && !order.trackingId;

  return (
    <td className="p-3 align-top">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(order)}
          disabled={locked}
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(order)}
          disabled={locked}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Delete
        </button>

        <button
          onClick={() => onSendCourier(order)}
          disabled={!canSendCourier}
          className={`px-3 py-1 rounded text-sm text-white ${
            canSendCourier ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Send to Courier
        </button>
      </div>
    </td>
  );
}
