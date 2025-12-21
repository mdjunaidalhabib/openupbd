import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Order from "../../models/Order.js";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browser;
(async () => {
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
})();

function formatDateTime(date) {
  const d = new Date(date);
  return {
    datePart: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    timePart: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

router.get("/invoice/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");

    const { datePart, timePart } = formatDateTime(order.createdAt);
    const publicPath = path.join(__dirname, "../../../public");
    const templatePath = path.join(
      __dirname,
      "../../../templates/invoice.html"
    );
    const cssPath = path.join(publicPath, "invoice.css");
    const imagePath = path.join(publicPath, "invoice-template.png");

    // ব্যাকগ্রাউন্ড ইমেজকে Base64 এ কনভার্ট করা
    const base64Image = `data:image/png;base64,${fs
      .readFileSync(imagePath)
      .toString("base64")}`;

    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    const itemRows = order.items
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

    const finalHtml = htmlTemplate
      .replace("{{orderId}}", order._id.toString())
      .replace("{{date}}", datePart)
      .replace("{{time}}", timePart)
      .replace("{{payment}}", order.paymentMethod.toUpperCase())
      .replace("{{name}}", order.billing.name)
      .replace("{{phone}}", order.billing.phone)
      .replace("{{address}}", order.billing.address)
      .replace("{{note}}", order.billing.note || "")
      .replace("{{items}}", itemRows)
      .replace("{{subtotal}}", order.subtotal)
      .replace("{{delivery}}", order.deliveryCharge)
      .replace("{{discount}}", order.discount || 0)
      .replace("{{total}}", order.total);

    const page = await browser.newPage();

    // গুরুত্বপূর্ণ: ব্যাকগ্রাউন্ড ইমেজ স্টাইলটি সরাসরি এখানে ইনজেক্ট করা হচ্ছে
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.addStyleTag({ path: cssPath }); // এক্সটার্নাল সিএসএস লোড
    await page.addStyleTag({
      content: `body { background-image: url("${base64Image}"); }`,
    }); // ইমেজ লোড

    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width: 100%; font-family: 'Arial'; font-size: 10px; padding: 0 50px 10px; display: flex; justify-content: space-between; color: #888;">
          <span>Invoice #${order._id.toString().slice(-6)}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "20px", bottom: "60px", left: "0px", right: "0px" },
    });

    await page.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).send("Error generating invoice");
  }
});

export default router;
