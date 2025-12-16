import { STATUS_OPTIONS, STATUS_LABEL } from "../shared/constants";

export default function BulkActions({
  selected,
  selectedOrders,

  /* from useOrdersManager */
  sameStatus,
  bulkStatus,
  canBulkSendCourier,

  /* actions */
  onStatusChange,
  onBulkStatusChange,
  onSendCourier,
  onBulkSendCourier,
  onDelete,
  onBulkDelete,

  setSelected,
}) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border rounded-full px-3 py-1.5 shadow-sm mr-2">
      {/* Selected count */}
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
            if (!status) return;

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
          onClick={() => {
            selected.length === 1
              ? onSendCourier(selectedOrders[0])
              : onBulkSendCourier(selectedOrders);
            setSelected([]);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-xs"
        >
          Courier
        </button>
      )}

      {/* BULK DELETE */}
      <button
        onClick={() => {
          selected.length === 1
            ? onDelete(selectedOrders[0])
            : onBulkDelete(selected);
          setSelected([]);
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs"
      >
        Delete
      </button>
    </div>
  );
}
