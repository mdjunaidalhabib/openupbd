"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "../../../context/UserContext";
import { apiFetch } from "../../../utils/api";
import Toast from "../../../components/home/Toast";
import EditOrderForm from "../../../components/orders/EditOrderForm";

// ✅ Custom date-time formatter
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", " •");
};

export default function OrdersPage() {
  const { me, loadingUser } = useUser();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("lifetime");

  // 🔔 toast
  const [toast, setToast] = useState(null);

  // ✏️ edit modal
  const [editOrder, setEditOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ===============================
  // Toast helper (same old pattern)
  // ===============================
  const showToast = (message, type = "success", time = 2000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), time);
  };

  // ===============================
  // Fetch orders
  // ===============================
  useEffect(() => {
    if (!loadingUser && me) {
      (async () => {
        try {
          const data = await apiFetch(`/orders?userId=${me.userId}`);
          setOrders(data || []);
          setFilteredOrders(data || []);
        } catch (err) {
          console.error(err);
          setError("Failed to load orders");
        } finally {
          setLoadingOrders(false);
        }
      })();
    }
  }, [me, loadingUser]);

  // ===============================
  // Filter orders
  // ===============================
  useEffect(() => {
    if (!orders.length) return;

    const now = new Date();
    let cutoff = null;

    if (filter === "1m") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 1);
    } else if (filter === "6m") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 6);
    }

    const result = cutoff
      ? orders.filter((o) => new Date(o.createdAt) >= cutoff)
      : orders;

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [filter, orders]);

  // ===============================
  // Pagination
  // ===============================
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ===============================
  // Update order
  // ===============================
  const saveBilling = async (billing) => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/orders/${editOrder._id}`, {
        method: "PUT",
        body: JSON.stringify({ billing }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );

      setEditOrder(null);
      showToast("✅ Order updated");
    } catch {
      showToast("❌ Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // Cancel order (NOT delete)
  // ===============================
  const cancelOrder = async (orderId) => {
    if (!confirm("Cancel this order?")) return;

    try {
      const updated = await apiFetch(`/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "cancelled",
          cancelReason: "Cancelled by customer",
        }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );

      showToast("🚫 Order cancelled");
    } catch {
      showToast("❌ Cancel failed", "error");
    }
  };

  // ===============================
  // UI states
  // ===============================
  if (loadingUser || loadingOrders)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Loading orders...</p>
      </div>
    );

  if (!me)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You are not logged in</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  // ===============================
  // MAIN UI
  // ===============================
  return (
    <>
      {/* 🔔 Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ✏️ Edit Modal */}
      {editOrder && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-4">
            <h3 className="font-semibold mb-3">✏️ Edit Order</h3>
            <EditOrderForm
              billingData={editOrder.billing}
              loading={saving}
              onSave={saveBilling}
              onCancel={() => setEditOrder(null)}
            />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="1m">Last 1 Month</option>
            <option value="6m">Last 6 Months</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        {/* 📱 Mobile Card View */}
        <div className="grid gap-4 sm:hidden">
          {paginatedOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No orders found.
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg p-3 border shadow-sm"
              >
                <p className="font-semibold text-sm">
                  #{order.orderId || order._id}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(order.createdAt)}
                </p>
                <p className="text-xs mt-1">Total: ৳{order.total}</p>

                {/* ✅ Cancel Reason */}
                {order.status === "cancelled" && order.cancelReason && (
                  <p className="text-[11px] mt-1 text-red-600 leading-tight">
                    <span className="font-semibold">Reason:</span>{" "}
                    {order.cancelReason}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/orders/${order._id}`}
                    className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded text-center"
                  >
                    🧾 View
                  </Link>

                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => setEditOrder(order)}
                        className="flex-1 bg-yellow-500 text-white text-xs py-1.5 rounded"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded"
                      >
                        🚫 Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 💻 Desktop Table View */}
        <div className="hidden sm:block bg-white shadow rounded-lg overflow-x-auto">
          {paginatedOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No orders found.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="border-t">
                    <td className="p-3">{order.orderId || order._id}</td>
                    <td className="p-3">{formatDateTime(order.createdAt)}</td>

                    {/* ✅ Status + Cancel Reason */}
                    <td className="p-3">
                      <div className="font-semibold capitalize">
                        {order.status}
                      </div>

                      {order.status === "cancelled" && order.cancelReason && (
                        <div className="text-[11px] text-red-600 leading-tight mt-1">
                          <span className="font-semibold">Reason:</span>{" "}
                          {order.cancelReason}
                        </div>
                      )}
                    </td>

                    <td className="p-3">৳{order.total}</td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/orders/${order._id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                        >
                          View
                        </Link>

                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => setEditOrder(order)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded text-xs"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => cancelOrder(order._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              🚫 Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-4 my-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
