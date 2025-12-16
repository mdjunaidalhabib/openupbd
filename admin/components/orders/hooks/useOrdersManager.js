import { useMemo, useState } from "react";

/**
 * SHARED ORDER MANAGER
 * works for desktop + mobile
 */
export default function useOrdersManager({
  orders = [],
  tabStatus = "",
  search = "",
  lockStatuses = ["delivered", "cancelled"],
}) {
  /* ===============================
     FILTER
  =============================== */
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];

    if (tabStatus) {
      list = list.filter((o) => o.status === tabStatus);
    }

    if (search?.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          o.billing?.name?.toLowerCase().includes(q) ||
          o.billing?.phone?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, tabStatus, search]);

  /* ===============================
     SELECTION
  =============================== */
  const [selected, setSelected] = useState([]);

  const selectableIds = useMemo(
    () =>
      filteredOrders
        .filter((o) => !lockStatuses.includes(o.status))
        .map((o) => o._id),
    [filteredOrders, lockStatuses]
  );

  const toggleOne = (id) => {
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  const toggleAll = () => {
    setSelected((p) =>
      p.length === selectableIds.length ? [] : selectableIds
    );
  };

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selected.includes(o._id)),
    [filteredOrders, selected]
  );

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.includes(id));

  /* ===============================
     BULK RULES
  =============================== */
  const sameStatus =
    selectedOrders.length > 0 &&
    selectedOrders.every((o) => o.status === selectedOrders[0].status);

  const bulkStatus = sameStatus ? selectedOrders[0].status : "";

  const canBulkSendCourier =
    selectedOrders.length > 0 &&
    selectedOrders.every(
      (o) => o.status === "ready_to_delivery" && !o.trackingId
    );

  return {
    /* data */
    filteredOrders,
    selected,
    selectedOrders,
    selectableIds,

    /* selection */
    setSelected,
    toggleOne,
    toggleAll,
    allSelected,

    /* bulk helpers */
    sameStatus,
    bulkStatus,
    canBulkSendCourier,
  };
}
