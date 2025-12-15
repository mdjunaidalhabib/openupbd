import { Edit3, Trash2, Send } from "lucide-react";
import IconBtn from "./IconBtn";
import { STATUS_OPTIONS, STATUS_LABEL } from "./constants";

export default function OrderActions({
  order,
  locked,
  updating,
  onEdit,
  onDelete,
  onSendCourier,
  onStatusChange,
}) {
  const canSendCourier =
    order.status === "ready_to_delivery" && !order.trackingId;

  return (
    <div className="flex items-center justify-between gap-2">
      <select
        className="h-8 rounded-md border px-2 text-xs font-semibold"
        value={order.status}
        onChange={(e) => onStatusChange(order._id, e.target.value)}
        disabled={locked || updating}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        <IconBtn
          onClick={() => onEdit(order)}
          className="bg-yellow-500 text-white"
        >
          <Edit3 size={14} />
        </IconBtn>

        <IconBtn
          onClick={() => onDelete(order)}
          className="bg-red-600 text-white"
        >
          <Trash2 size={14} />
        </IconBtn>

        <IconBtn
          onClick={() => onSendCourier(order)}
          disabled={!canSendCourier}
          className={
            canSendCourier
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
          }
        >
          <Send size={14} />
        </IconBtn>
      </div>
    </div>
  );
}
