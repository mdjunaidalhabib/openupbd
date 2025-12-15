import { ChevronDown, ChevronUp } from "lucide-react";
import { STATUS_COLORS, STATUS_LABEL } from "./constants";
import { formatOrderTime } from "./utils";

export default function OrderHeader({
  order,
  expanded,
  toggle,
  bulkEnabled,
  selected,
  toggleOne,
  locked,
  itemCount,
}) {
  return (
    <div className="flex gap-2 items-start">
      {bulkEnabled && (
        <input
          type="checkbox"
          className="mt-1"
          checked={selected}
          onChange={toggleOne}
          disabled={locked}
        />
      )}

      <button onClick={toggle} className="flex-1 flex gap-2 text-left">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
            STATUS_COLORS[order.status]
          }`}
        >
          {STATUS_LABEL[order.status]}
        </span>

        <div className="flex-1 min-w-0">
          <div className="truncate text-xs font-semibold">
            {order.billing?.name || "Unknown"}
          </div>
          <div className="text-[10px] text-gray-400 font-mono truncate">
            #{order._id}
          </div>
          <div className="mt-0.5 flex gap-2 text-[11px] text-gray-600">
            <span>{formatOrderTime(order)}</span>
            <span>{itemCount} items</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-extrabold">৳{order.total}</div>
          <div className="text-[10px] text-gray-400">
            {expanded ? "close" : "open"}
          </div>
        </div>

        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}
