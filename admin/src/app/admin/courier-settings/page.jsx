"use client";
import { useEffect, useState } from "react";
import Toast from "../../../../components/Toast";

export default function CourierSettingsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [couriers, setCouriers] = useState([]);
  const [activeCourier, setActiveCourier] = useState(null);

  const [form, setForm] = useState({
    courier: "steadfast",
    merchantName: "",
    apiKey: "",
    secretKey: "",
    baseUrl: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ custom toast
  const [toast, setToast] = useState(null);

  // ✅ confirm modal state
  const [confirmModal, setConfirmModal] = useState(null);
  // { type: "active"|"delete", payload: any }

  // 🔹 Load couriers and active courier separately
  const fetchCouriers = async () => {
    try {
      const [courierRes, activeRes] = await Promise.all([
        fetch(`${API}/admin/courier-settings`),
        fetch(`${API}/admin/active-courier`),
      ]);

      const list = await courierRes.json();
      const active = await activeRes.json();

      setCouriers(Array.isArray(list) ? list : []);
      setActiveCourier(active || null);
    } catch (e) {
      console.error("Fetch error:", e);
      setToast({ message: "⚠️ ডেটা লোড করা যায়নি!", type: "error" });
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  // 🔹 Save or update courier
  const saveCourier = async () => {
    if (
      !form.merchantName ||
      !form.apiKey ||
      !form.secretKey ||
      !form.baseUrl
    ) {
      setToast({ message: "⚠️ সব ফিল্ড পূরণ করুন!", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/admin/courier-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setToast({
        message: data.message || "✅ Courier Saved!",
        type: "success",
      });

      await fetchCouriers();

      setForm({
        courier: "steadfast",
        merchantName: "",
        apiKey: "",
        secretKey: "",
        baseUrl: "",
      });
    } catch (err) {
      console.error(err);
      setToast({
        message: err.message || "❌ Failed to save courier!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Open confirm modal for set active
  const askSetActive = (courier, merchantName) => {
    setConfirmModal({
      type: "active",
      payload: { courier, merchantName },
    });
  };

  // 🔹 Set active courier (modal confirm)
  const setActive = async () => {
    if (!confirmModal || confirmModal.type !== "active") return;
    const { courier, merchantName } = confirmModal.payload;

    try {
      const res = await fetch(`${API}/admin/set-active-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier, merchantName }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to activate courier");

      setToast({ message: data.message || "✅ Activated!", type: "success" });

      // ✅ update UI instantly
      const activeRes = await fetch(`${API}/admin/active-courier`);
      const active = await activeRes.json();
      setActiveCourier(active);

      const courierRes = await fetch(`${API}/admin/courier-settings`);
      const list = await courierRes.json();
      setCouriers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setToast({
        message: err.message || "❌ Could not set active courier!",
        type: "error",
      });
    } finally {
      setConfirmModal(null);
    }
  };

  // 🔹 Open confirm modal for delete
  const askDeleteCourier = (courierObj) => {
    setConfirmModal({
      type: "delete",
      payload: courierObj,
    });
  };

  // 🔹 Delete courier (modal confirm)
  const deleteCourier = async () => {
    if (!confirmModal || confirmModal.type !== "delete") return;
    const c = confirmModal.payload;

    try {
      const res = await fetch(`${API}/admin/courier-settings/${c._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setToast({
        message: data.message || "🗑 Courier deleted!",
        type: "success",
      });

      await fetchCouriers();
    } catch (err) {
      console.error(err);
      setToast({
        message: err.message || "❌ Failed to delete courier!",
        type: "error",
      });
    } finally {
      setConfirmModal(null);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">🚚 Courier Settings</h2>

      {/* Form */}
      <div className="bg-white p-4 rounded-lg shadow border space-y-3">
        <h3 className="text-lg font-semibold">Add / Update Courier</h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Courier</label>
            <select
              className="w-full border rounded p-2"
              value={form.courier}
              onChange={(e) => setForm({ ...form, courier: e.target.value })}
            >
              <option value="steadfast">Steadfast</option>
              <option value="pathao">Pathao</option>
              <option value="redx">RedX</option>
              <option value="ecourier">eCourier</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Merchant Name</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Merchant name"
              value={form.merchantName}
              onChange={(e) =>
                setForm({ ...form, merchantName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">API Key</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Enter API Key"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Secret Key</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Enter Secret Key"
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Base URL</label>
            <input
              className="w-full border rounded p-2"
              placeholder="https://portal.packzy.com/api/v1"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={saveCourier}
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white px-4 py-2 rounded mt-3`}
        >
          {loading ? "Saving..." : "Save Courier"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Courier Accounts</h3>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Courier</th>
              <th className="p-2 text-left">Merchant</th>
              <th className="p-2 text-left">Base URL</th>
              <th className="p-2 text-center">Active</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((c) => {
              const isActive =
                activeCourier?.courier?.toLowerCase() ===
                  c.courier?.toLowerCase() &&
                activeCourier?.merchantName === c.merchantName;

              return (
                <tr
                  key={c._id}
                  className={`border-t ${
                    isActive ? "bg-green-50 border-green-400" : ""
                  }`}
                >
                  <td className="p-2 font-medium">{c.courier}</td>
                  <td className="p-2">{c.merchantName}</td>
                  <td className="p-2 text-gray-600">{c.baseUrl}</td>
                  <td className="p-2 text-center">
                    {isActive ? (
                      <span className="text-green-600 font-semibold">
                        🟢 Active
                      </span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {!isActive && (
                      <button
                        onClick={() => askSetActive(c.courier, c.merchantName)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => askDeleteCourier(c)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ CONFIRM MODAL (No browser popup) */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl border">
              {confirmModal.type === "active" ? (
                <>
                  <h3 className="text-lg font-bold mb-2 text-indigo-600">
                    Activate Courier?
                  </h3>
                  <p className="text-sm text-gray-700">
                    আপনি কি{" "}
                    <span className="font-semibold">
                      {confirmModal.payload.courier} (
                      {confirmModal.payload.merchantName})
                    </span>{" "}
                    একটিভ করতে চান?
                  </p>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-3 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={setActive}
                      className="px-3 py-2 bg-indigo-600 text-white rounded"
                    >
                      Yes, Activate
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-2 text-red-600">
                    Delete Courier?
                  </h3>
                  <p className="text-sm text-gray-700">
                    আপনি কি{" "}
                    <span className="font-semibold">
                      {confirmModal.payload.courier} (
                      {confirmModal.payload.merchantName})
                    </span>{" "}
                    ডিলিট করতে চান?
                  </p>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-3 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteCourier}
                      className="px-3 py-2 bg-red-600 text-white rounded"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ✅ TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
