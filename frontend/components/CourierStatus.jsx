"use client";
import { useEffect, useState } from "react";
import Badge from "./Badge";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      {/* ✅ same UI, just add flex + max height */}
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header (same) */}
        <div className="flex items-center justify-between px-8 py-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">
            📦 Tracking Updates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        {/* ✅ Body scroll enabled (same padding) */}
        <div className="p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function CourierStatus({ trackingId, courier }) {
  const activeTrackingId = courier?.trackingId || trackingId;

  const [status, setStatus] = useState(courier?.status || null);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const displayStatus = (status || courier?.status || "unknown")
    .replaceAll("_", " ")
    .toUpperCase();

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    if (!activeTrackingId) return;

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(
          `${apiUrl}/admin/api/courier/status?trackingId=${activeTrackingId}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        setStatus(data?.status || "unknown");
      } catch {}
      setLoading(false);
    };

    fetchStatus();
  }, [activeTrackingId]);

  /* ================= FETCH EVENTS ================= */
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiUrl}/admin/api/courier/live?trackingId=${activeTrackingId}`,
        { cache: "no-store" },
      );
      const data = await res.json();

      const sorted = Array.isArray(data?.events)
        ? [...data.events].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
          )
        : [];

      setEvents(sorted);
    } catch {}
    setEventsLoading(false);
  };

  const openModal = () => {
    setModalOpen(true);
    fetchEvents();
  };

  const closeModal = () => setModalOpen(false);

  if (!activeTrackingId) {
    return <div className="text-xs text-gray-400">Courier not created</div>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="text-xs text-gray-400">Loading...</div>
        ) : (
          <Badge>🚚 {displayStatus}</Badge>
        )}

        <button
          onClick={openModal}
          className="text-xs px-3 py-1 rounded border bg-white hover:bg-gray-100 transition"
        >
          Live Tracking
        </button>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        {eventsLoading ? (
          <div className="text-center text-gray-500">Loading timeline...</div>
        ) : (
          <div className="relative pl-6 border-l-2 border-gray-300 space-y-2">
            {events.map((e, idx) => {
              const message = e?.status || "Unknown update";
              const date = e?.timestamp
                ? new Date(e.timestamp).toLocaleString()
                : "—";

              return (
                <div key={idx} className="relative">
                  {/* Dot (same) */}
                  <div className="absolute -left-[11px] top-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] shadow">
                    ✓
                  </div>

                  {/* Card (same) */}
                  <div className="bg-gray-50 border rounded-lg px-4 py-2 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">{date}</div>

                    {/* ✅ wrap long text */}
                    <div className="text-sm font-medium text-gray-800 leading-snug break-words whitespace-pre-wrap">
                      {message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
