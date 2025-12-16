"use client";

import { STATUS_OPTIONS, STATUS_LABEL } from "../shared/constants";

export default function StatusSummary({
  orders,
  tabStatus,
  setTabStatus,
  statusCount,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white border-b px-2 py-2">
      <select
        value={tabStatus}
        onChange={(e) => setTabStatus(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      >
        <option value="">ALL ({orders.length})</option>

        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]} ({statusCount[s] ?? 0})
          </option>
        ))}
      </select>
    </div>
  );
}
