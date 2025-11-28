"use client";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import useOrders from "../../../../hooks/useOrders";
import OrdersGrid from "../../../../components/orders/OrdersGrid";
import OrdersTable from "../../../../components/orders/OrdersTable";
import EditOrderModal from "../../../../components/orders/EditOrderModal";
import OrdersSkeleton from "../../../../components/Skeleton/OrdersSkeleton";

export default function OrdersPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  // ✅ useOrders থেকে সব কিছু পাওয়া যাবে
  const {
    filtered,
    loading,
    filter,
    setFilter,
    fetchOrders,
    sendingId,
    sendToCourier, // 🔥 নতুন Dynamic Courier Function
    updateStatus,
    deleteOrder,
  } = useOrders(API);

  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({
    status: "pending",
    paymentMethod: "cod",
    trackingId: "",
    cancelReason: "",
    billing: { name: "", phone: "", address: "" },
  });

  // 🔹 Edit Modal খোলা
  const openEdit = (order) => {
    setCurrentId(order._id);
    setForm({
      status: order.status || "pending",
      paymentMethod: order.paymentMethod || "cod",
      trackingId: order.trackingId || "",
      cancelReason: order.cancelReason || "",
      billing: {
        name: order.billing?.name || "",
        phone: order.billing?.phone || "",
        address: order.billing?.address || "",
      },
    });
    setOpen(true);
  };

  // ✅ Order আপডেট ফাংশন
  const updateOrder = async (updatedForm) => {
    try {
      const res = await fetch(`${API}/api/orders/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchOrders();
      setOpen(false);
      return { success: true };
    } catch (e) {
      console.error("Update error:", e);
      alert("Failed to update order.");
      return { success: false };
    }
  };

  // 🔹 CSV / Excel / PDF Export Functions (আগের মতোই থাকবে)
  const exportCSV = () => {
    const csv = Papa.unparse(
      filtered.map((o) => ({
        OrderID: o._id,
        Customer: o.billing?.name || "",
        Phone: o.billing?.phone || "",
        Address: o.billing?.address || "",
        Status: o.status,
        Method: o.paymentMethod,
        Total: o.total,
        Date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
      }))
    );
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "orders.csv");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((o) => ({
        OrderID: o._id,
        Customer: o.billing?.name || "",
        Phone: o.billing?.phone || "",
        Address: o.billing?.address || "",
        Status: o.status,
        Method: o.paymentMethod,
        Total: o.total,
        Date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "orders.xlsx"
    );
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Orders Report", 14, 16);
    const tableData = filtered.map((o) => [
      o._id,
      o.billing?.name || "",
      o.billing?.phone || "",
      o.status,
      o.paymentMethod?.toUpperCase(),
      "৳" + o.total,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
    ]);
    autoTable(doc, {
      head: [
        ["OrderID", "Customer", "Phone", "Status", "Method", "Total", "Date"],
      ],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
    });
    doc.save("orders.pdf");
  };

  return (
    <div className="space-y-4 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Orders</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
          >
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search by OrderID / Name / Phone"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <select
          className="border rounded px-3 py-2 sm:w-40"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All status</option>
          {[
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={fetchOrders}
          className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Table/Grid */}
      {loading ? (
        <OrdersSkeleton />
      ) : (
        <>
          <OrdersGrid
            orders={filtered}
            onEdit={openEdit}
            onDelete={deleteOrder}
            onStatusChange={updateStatus}
            onSendCourier={sendToCourier} // ✅ নতুন prop
            sendingId={sendingId}
          />
          <OrdersTable
            orders={filtered}
            onEdit={openEdit}
            onDelete={deleteOrder}
            onStatusChange={updateStatus}
            onSendCourier={sendToCourier} // ✅ নতুন prop
            sendingId={sendingId}
          />
        </>
      )}

      {/* Edit Modal */}
      <EditOrderModal
        open={open}
        form={form}
        setForm={setForm}
        onSave={() => updateOrder(form)}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
