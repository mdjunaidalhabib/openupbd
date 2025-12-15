"use client";
import { useMemo, useState } from "react";
import OrdersFilterBar from "./OrdersFilterBar";
import BulkActionBar from "./BulkActionBar";
import OrdersTableView from "./OrdersTableView";

/**
 * 🔑 ONE SOURCE OF TRUTH
 * backend / UI / filter – সব জায়গায় একই format
 */
const normalizeStatus = (status) => {
  if (!status) return "";
  return status.toString().toLowerCase().replace(/[\s-]/g, "_");
};

export default function OrdersTable(props) {
  const {
    orders = [],
    onBulkStatusChange,
    onBulkDelete,
    onBulkSendCourier,
  } = props;

  const [q, setQ] = useState("");
  const [tabStatus, setTabStatus] = useState(""); // ex: "pending"
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");

  /**
   * ✅ FILTER LOGIC (FIXED)
   */
  const filteredOrders = useMemo(() => {
    let list = orders;

    // 🔥 STATUS FILTER (FINAL FIX)
    if (tabStatus) {
      list = list.filter(
        (o) => normalizeStatus(o.status) === normalizeStatus(tabStatus)
      );
    }

    // 🔍 SEARCH FILTER
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(
        (o) =>
          o._id?.toLowerCase().includes(qq) ||
          o.billing?.name?.toLowerCase().includes(qq) ||
          o.billing?.phone?.toLowerCase().includes(qq)
      );
    }

    return list;
  }, [orders, q, tabStatus]);

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelected([]);
    setBulkStatus("");
  };

  const selectedOrders = filteredOrders.filter((o) => selected.includes(o._id));

  return (
    // 🖥 Desktop only
    <div className="hidden md:block space-y-3">
      <OrdersFilterBar
        q={q}
        setQ={setQ}
        tabStatus={tabStatus}
        setTabStatus={(s) => setTabStatus(normalizeStatus(s))}
        count={filteredOrders.length}
      />

      {selected.length > 0 && (
        <BulkActionBar
          selected={selected}
          selectedOrders={selectedOrders}
          bulkStatus={bulkStatus}
          setBulkStatus={setBulkStatus}
          onBulkStatusChange={onBulkStatusChange}
          onBulkDelete={onBulkDelete}
          onBulkSendCourier={onBulkSendCourier}
          clearSelection={clearSelection}
        />
      )}

      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        <OrdersTableView
          orders={filteredOrders}
          selected={selected}
          toggleOne={toggleOne}
          bulkEnabled
          {...props}
        />
      </div>
    </div>
  );
}
