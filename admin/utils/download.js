export async function downloadReceipt(orderId) {
  try {
    console.log("🖱️ Download button clicked for:", orderId);

    const res = await fetch(
      `http://localhost:4000/api/orders/${orderId}/receipt`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    console.log("📥 Requesting receipt for order:", orderId);
    console.log("🔎 Response status:", res.status);

    if (!res.ok) {
      console.error("❌ Failed to fetch receipt");
      return;
    }

    const blob = await res.blob();
    console.log("📦 Got blob:", blob);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("✅ Download triggered");
  } catch (err) {
    console.error("🔥 Download error:", err);
  }
}
