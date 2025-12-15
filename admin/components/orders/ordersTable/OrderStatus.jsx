import { useState } from "react";
import { STATUS_OPTIONS, STATUS_LABEL, STATUS_BADGE_COLOR } from "./constants";

export default function OrderStatus({ order, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const locked = order.status === "delivered" || order.status === "cancelled";

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await onStatusChange(order._id, { status: newStatus });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <td className="p-3 align-top">
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full border ${
          STATUS_BADGE_COLOR[order.status]
        }`}
      >
        {STATUS_LABEL[order.status]}
      </span>

      <select
        className="mt-1 border rounded px-2 py-1 text-sm w-full"
        value={order.status}
        onChange={handleChange}
        disabled={locked || updating}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </td>
  );
}
