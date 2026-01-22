"use client";
import { useMemo, useState } from "react";
import ModalWrapper from "./ModalWrapper";

function statusColor(status = "") {
  const s = String(status || "").toLowerCase();

  if (s.includes("delivered"))
    return "bg-green-50 text-green-700 border-green-200";
  if (s.includes("cancel")) return "bg-red-50 text-red-700 border-red-200";
  if (s.includes("hold"))
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s.includes("review")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (s.includes("pending")) return "bg-gray-50 text-gray-700 border-gray-200";

  return "bg-purple-50 text-purple-700 border-purple-200";
}

export default function CourierTrackModal({
  order,
  status,
  onClose,
  onRefresh, // ✅ optional: pass fetchCourierStatus(order)
}) {
  const [copied, setCopied] = useState(false);

  const cid = useMemo(
    () => (order?.trackingId ? String(order.trackingId) : ""),
    [order],
  );

  // ✅ Steadfast portal public tracking page (না থাকলে remove করতে পারেন)
  const trackingUrl = useMemo(() => {
    if (!cid) return "";
    // আপনার যদি অন্য URL লাগে, এখানে বদলাবেন
    return `https://steadfast.com.bd/tracking/${cid}`;
  }, [cid]);

  if (!order) return null;

  const badgeClass = `inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full border ${statusColor(
    status,
  )}`;

  const copyCid = async () => {
    if (!cid) return;
    try {
      await navigator.clipboard.writeText(cid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback silent
    }
  };

  return (
    <ModalWrapper open={!!order}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Courier Tracking</h2>
          <p className="text-xs text-gray-500 mt-1">
            Steadfast status live check (CID based)
          </p>
        </div>

        <button
          onClick={onClose}
          className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 text-sm font-semibold"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Order ID</div>
          <div className="font-mono text-xs break-all">{order._id}</div>
        </div>

        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="text-xs text-gray-500">Consignment ID (CID)</div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="font-mono text-sm font-bold break-all">
              {cid || "N/A"}
            </div>

            <button
              onClick={copyCid}
              disabled={!cid}
              className={`h-8 px-3 rounded-full text-xs font-bold border ${
                !cid
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {copied ? "Copied ✅" : "Copy"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500 mb-1">
            Current Courier Status
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={badgeClass}>{status || "Checking..."}</span>

            <button
              onClick={onRefresh}
              disabled={!onRefresh}
              className={`h-8 px-3 rounded-full text-xs font-bold border ${
                !onRefresh
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:opacity-90"
              }`}
            >
              Refresh
            </button>

            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-full text-xs font-bold border bg-white hover:bg-gray-50 inline-flex items-center"
              >
                Open Tracking ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={onClose}
          className="h-10 px-4 rounded-lg bg-gray-800 text-white text-sm font-bold hover:opacity-90"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}
