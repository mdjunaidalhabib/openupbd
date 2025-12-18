import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Order from "../../models/Order.js";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= DATE TIME FORMATTER ================= */
function formatDateTime(date) {
  const d = new Date(date);

  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { datePart, timePart };
}

/* ================= INVOICE ROUTE ================= */
router.get("/invoice/:id", async (req, res) => {
  try {
    /* ---- FETCH ORDER ---- */
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");

    /* ---- FORMAT DATE & TIME (✅ CORRECT PLACE) ---- */
    const { datePart, timePart } = formatDateTime(order.createdAt);

    /* ---- LOAD HTML TEMPLATE ---- */
    let html = fs.readFileSync(
      path.join(__dirname, "../../../templates/invoice.html"),
      "utf8"
    );

    /* ---- BUILD ITEM ROWS ---- */
    const rows = order.items
      .map(
        (item) => `
        <div class="row">
          <span>${item.name}</span>
          <span>${item.price}</span>
          <span>${item.qty}</span>
          <span>${item.qty * item.price}</span>
        </div>
      `
      )
      .join("");

    /* ---- REPLACE PLACEHOLDERS ---- */
    html = html
      .replace("{{orderId}}", order._id.toString())
      .replace("{{date}}", datePart)
      .replace("{{time}}", timePart)
      .replace("{{payment}}", order.paymentMethod.toUpperCase())
      .replace("{{name}}", order.billing.name)
      .replace("{{phone}}", order.billing.phone)
      .replace("{{address}}", order.billing.address)
      .replace("{{note}}", order.billing.note || "")
      .replace("{{items}}", rows)
      .replace("{{subtotal}}", order.subtotal)
      .replace("{{delivery}}", order.deliveryCharge)
      .replace("{{discount}}", order.discount || 0)
      .replace("{{total}}", order.total);

    /* ---- WRITE TEMP HTML ---- */
    const tempHtmlPath = path.join(
      __dirname,
      "../../../public/invoice-temp.html"
    );
    fs.writeFileSync(tempHtmlPath, html);

    /* ---- LAUNCH BROWSER ---- */
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    /* ---- LOAD HTML FILE ---- */
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: "networkidle0",
    });

    /* ---- LOAD CSS ---- */
    await page.addStyleTag({
      path: path.join(__dirname, "../../../public/invoice.css"),
    });

    /* ---- GENERATE PDF (WITH PAGE NUMBER) ---- */
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate: `<div></div>`,

      footerTemplate: `
        <div style="
          width: 100%;
          font-size: 10px;
          padding: 0 40px;
          box-sizing: border-box;
          color: #555;
          display: flex;
          justify-content: space-between;
        ">
          <span></span>
          <span>
            Page <span class="pageNumber"></span> of
            <span class="totalPages"></span>
          </span>
        </div>
      `,

      margin: {
        top: "0px",
        bottom: "40px",
        left: "0px",
        right: "0px",
      },
    });

    await browser.close();
    fs.unlinkSync(tempHtmlPath);

    /* ---- RESPONSE ---- */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
