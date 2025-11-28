// backend/pdfTemplates/receiptPDF.js
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

const BRAND_NAME = "হাবিব'স ফ্যাশন";
const BENGALI_FONT = "fonts/NotoSansBengali-Regular.ttf";

function formatCurrency(amount) {
  return `৳${Number(amount).toLocaleString()}`;
}

// ===== Draw table row with optional fill color =====
function drawTableRow(doc, y, item, isHeader = false, fillColor = null) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const tableWidth = right - left;

  if (fillColor) {
    doc.rect(left, y, tableWidth, 20).fill(fillColor).fillColor("black");
  }

  doc.fontSize(12).font(BENGALI_FONT).fillColor("black");

  const col1 = left + 5;               // পণ্য
  const col2 = left + tableWidth * 0.5; // পরিমাণ
  const col3 = left + tableWidth * 0.65; // মূল্য (প্রতি)
  const col4 = left + tableWidth * 0.85; // মোট

  doc.text(item.name, col1, y + 5, { width: tableWidth * 0.45 });
  doc.text(item.qty, col2, y + 5, { width: tableWidth * 0.15, align: "right" });
  doc.text(item.unitPrice, col3, y + 5, { width: tableWidth * 0.2, align: "right" });
  doc.text(item.total, col4, y + 5, { width: tableWidth * 0.15, align: "right" });
}

export function generateReceiptPDF(order, stream) {
  const doc = new PDFDocument({ size: "A4", margin: 72 }); // 1 inch margin
  doc.pipe(stream);

  // ===== Background =====
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#F9FAFB"); // light gray background
  doc.fillColor("black"); // reset text color

  // ===== Header =====
  doc.font(BENGALI_FONT).fillColor("#1D4ED8")
    .fontSize(24).text(`🛍️ ${BRAND_NAME}`, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).fillColor("#374151").text(`রসিদ`, { align: "center" });
  doc.moveDown(1);

  // ===== Order Info =====
  doc.fillColor("#1E40AF").fontSize(14).text("📄 অর্ডারের তথ্য", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(`অর্ডার আইডি: ${order.orderId || order._id}`);
  doc.text(`তারিখ: ${dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}`);
  doc.text(`স্ট্যাটাস: ${order.status}`);
  doc.moveDown(0.5);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#E5E7EB").stroke();
  doc.moveDown(0.5);

  // ===== Customer Info =====
  const billing = order.billing || {};
  const address = [billing.address, billing.thana, billing.district, billing.division].filter(Boolean).join(", ");
  doc.fillColor("#166534").fontSize(14).text("👤 গ্রাহকের তথ্য", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(`নাম: ${billing.name || "-"}`);
  doc.text(`ফোন: ${billing.phone || "-"}`);
  doc.text(`ঠিকানা: ${address || "-"}`);
  doc.moveDown(0.5);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor("#E5E7EB").stroke();
  doc.moveDown(0.5);

  // ===== Items Table =====
  doc.fillColor("#374151").fontSize(14).text("📦 ক্রয়কৃত পণ্যসমূহ", { underline: true });
  doc.moveDown(0.3);

  const tableTop = doc.y;
  drawTableRow(doc, tableTop, { name: "পণ্য", qty: "পরিমাণ", unitPrice: "মূল্য (প্রতি)", total: "মোট" }, true, "#E5E7EB");
  let y = tableTop + 20;

  order.items.forEach((item, idx) => {
    const fill = idx % 2 === 0 ? "#F3F4F6" : null; // alternating light rows
    drawTableRow(doc, y, {
      name: item.name,
      qty: item.qty.toString(),
      unitPrice: formatCurrency(item.price),
      total: formatCurrency(item.price * item.qty)
    }, false, fill);
    y += 20;
  });

  doc.moveDown(0.5);

  // ===== Pricing Summary =====
  doc.moveDown(1);
  doc.fillColor("#B45309").fontSize(14).text("💰 মূল্যসারণি", { underline: true });
  doc.fillColor("black").fontSize(12);
  doc.text(`মোট: ${formatCurrency(order.subtotal)}`, doc.page.width - doc.page.margins.right - 150, doc.y, { width: 150, align: "right" });
  doc.text(`ডেলিভারি চার্জ: ${formatCurrency(order.deliveryCharge)}`, doc.page.width - doc.page.margins.right - 150, doc.y, { width: 150, align: "right" });
  if (order.discount) {
    doc.fillColor("#DC2626").text(`ডিসকাউন্ট: -${formatCurrency(order.discount)}`, doc.page.width - doc.page.margins.right - 150, doc.y, { width: 150, align: "right" });
    doc.fillColor("black");
  }
  doc.fontSize(16).fillColor("#15803D").text(`সর্বমোট: ${formatCurrency(order.total)}`, doc.page.width - doc.page.margins.right - 150, doc.y, { width: 150, align: "right", underline: true });
  doc.moveDown(1);

  // ===== Footer =====
  doc.fillColor("#6B7280").fontSize(12).text("✅ আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!", { align: "center", italics: true });
  doc.text("📞 Contact: 01234-567890 | ✉️ Email: info@habibsfashion.com", { align: "center" });

  doc.end();
}
