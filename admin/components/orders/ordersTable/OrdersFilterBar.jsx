import { STATUS_OPTIONS, STATUS_LABEL, STATUS_TEXT_COLOR } from "./constants";

export default function OrdersFilterBar({
  q,
  setQ,
  tabStatus,
  setTabStatus,
  count,
}) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 space-y-3">
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Search by OrderID / Name / Phone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setTabStatus("")}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
            tabStatus === ""
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          All
        </button>

        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setTabStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
              tabStatus === s
                ? "bg-blue-600 text-white"
                : `bg-white hover:bg-gray-50 ${STATUS_TEXT_COLOR[s]}`
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}

        <div className="ml-auto text-xs text-gray-500">
          Showing: <b>{count}</b>
        </div>
      </div>
    </div>
  );
}
