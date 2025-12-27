"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import Toast from "../../../../components/Toast";

export default function AdminOrderMailSendPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [dbEmail, setDbEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Read mode default
  const [isEditing, setIsEditing] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function loadEmail() {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/order-mail-send");
      const email = String(data?.adminEmail || "");
      setAdminEmail(email);
      setDbEmail(email);
    } catch (e) {
      showToast("❌ Email load failed!", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmail();
  }, []);

  async function saveEmail() {
    const email = adminEmail.trim();

    if (!emailRegex.test(email)) {
      showToast("⚠️ Valid email দিন", "error");
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch("/admin/order-mail-send", {
        method: "PATCH",
        body: JSON.stringify({ adminEmail: email }),
      });

      const savedEmail = String(data?.adminEmail || "");
      setDbEmail(savedEmail);
      setAdminEmail(savedEmail);

      showToast("✅ Updated!", "success");
      setIsEditing(false);
    } catch (e) {
      showToast("❌ Update failed!", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const isEmailSet = !!dbEmail?.trim();

  // ✅ Draft valid? (empty or valid email)
  const isValidDraft = !adminEmail.trim() || emailRegex.test(adminEmail.trim());

  // ✅ Changed? (Edit না করলে Save disabled থাকবে)
  const isDirty = adminEmail.trim() !== (dbEmail || "").trim();

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                📩 Order Mail Email
              </h2>
              <p className="text-xs text-gray-500">
                নতুন Order হলে এই Email এ notification যাবে।
              </p>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isEmailSet
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isEmailSet ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ✅ Read Mode */}
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Current Email
                </p>

                <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 border rounded-xl">
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {dbEmail || "Not set"}
                  </p>
                  {dbEmail && (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-pink-600 text-white py-2 rounded-xl font-bold hover:bg-pink-700 transition active:scale-[0.99]"
              >
                Edit
              </button>
            </div>
          ) : (
            /* ✅ Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-800">
                    Admin Email
                  </span>

                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className={`mt-1 w-full border px-4 py-3 rounded-xl outline-none focus:ring-2 ${
                      isValidDraft
                        ? "border-gray-200 focus:ring-pink-200"
                        : "border-red-300 focus:ring-red-200"
                    }`}
                    placeholder="admin@email.com"
                  />
                </label>

                {!isValidDraft && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Valid email দিন।
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setAdminEmail(dbEmail);
                    setIsEditing(false);
                  }}
                  disabled={saving}
                  className="w-full bg-gray-100 hover:bg-gray-200 transition py-2 rounded-xl font-bold text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={saveEmail}
                  // ✅ change না করলে save disabled
                  disabled={saving || !isValidDraft || !isDirty}
                  className="w-full bg-pink-600 text-white py-2 rounded-xl font-bold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-600"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />
    </div>
  );
}
