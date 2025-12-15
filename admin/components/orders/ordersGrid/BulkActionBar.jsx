import { STATUS_OPTIONS, STATUS_LABEL } from "./constants";

export default function BulkActionBar({
  selected,
  selectedOrders,
  bulkStatus,
  setBulkStatus,
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,
  clear,
}) {
  return (
    <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold">Selected: {selected.length}</span>

      <select
        className="border rounded px-2 py-1 text-xs"
        value={bulkStatus}
        onChange={(e) => setBulkStatus(e.target.value)}
      >
        <option value="">Change Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <button
        onClick={() => {
          if (!bulkStatus) return;
          onBulkStatusChange(selected, { status: bulkStatus });
          clear();
        }}
        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
      >
        Update
      </button>

      <button
        onClick={() => {
          onBulkSendCourier(selectedOrders);
          clear();
        }}
        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
      >
        Courier
      </button>

      <button
        onClick={() => {
          onBulkDelete(selected);
          clear();
        }}
        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
      >
        Delete
      </button>
    </div>
  );
}
