import { STATUS_OPTIONS, STATUS_LABEL } from "../shared/constants";

export default function BulkBar({
  selected,
  selectedOrders,

  /* from useOrdersManager */
  sameStatus,
  bulkStatus,
  canBulkSendCourier,

  setSelected,
  onStatusChange,
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,
  setConfirm,
}) {
  return (
    <div className="sticky top-[44px] z-20 bg-gray-50 border rounded-lg p-2 flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
        {selected.length} Selected
      </span>

      {/* BULK STATUS UPDATE */}
      {sameStatus && bulkStatus && (
        <select
          className="border rounded-full px-2 py-1 text-xs bg-white"
          value={bulkStatus}
          onChange={(e) => {
            const status = e.target.value;
            selected.length === 1
              ? onStatusChange(selected[0], { status })
              : onBulkStatusChange(selected, { status });
            setSelected([]);
          }}
        >
          <option value={bulkStatus} disabled>
            {STATUS_LABEL[bulkStatus]}
          </option>

          {STATUS_OPTIONS.filter((s) => s !== bulkStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      )}

      {/* BULK COURIER */}
      {sameStatus && canBulkSendCourier && (
        <button
          onClick={() =>
            setConfirm({ type: "courier", orders: selectedOrders })
          }
          className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs"
        >
          Courier
        </button>
      )}

      {/* BULK DELETE */}
      <button
        onClick={() => setConfirm({ type: "delete", orders: selectedOrders })}
        className="bg-red-600 text-white px-3 py-1 rounded-full text-xs"
      >
        Delete
      </button>
    </div>
  );
}
