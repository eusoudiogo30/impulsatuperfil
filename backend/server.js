import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const XPAG_API_URL = process.env.XPAG_API_URL || "https://api.xpag.global";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL || `http://localhost:${PORT}`;
const orders = new Map();

const catalog = {
  "Seguidores MX": { "1,000": 90, "3,000": 120, "5,000": 150, "10,000": 180, "15,000": 240, "20,000": 300, "40,000": 425, "50,000": 485, "100,000": 605 },
  "Me Gustas MX": { "100": 25, "500": 45, "1,000": 70, "3,000": 120, "5,000": 165, "10,000": 260 },
  Reproducciones: { "1,000": 20, "5,000": 45, "10,000": 70, "25,000": 120, "50,000": 180, "100,000": 290 },
  "Comentarios MX": { "10": 35, "25": 65, "50": 110, "100": 190, "250": 390, "500": 690 },
};

const allowedBumps = { likes: 42, views: 60, comments: 60 };

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: "32kb" }));

function xpagHeaders() {
  if (!process.env.XPAG_CLIENT_ID || !process.env.XPAG_CLIENT_SECRET) throw new Error("XPAG_NOT_CONFIGURED");
  return { "Content-Type": "application/json", "X-Client-Id": process.env.XPAG_CLIENT_ID, "X-Client-Secret": process.env.XPAG_CLIENT_SECRET };
}

async function xpagRequest(path, options = {}) {
  const response = await fetch(`${XPAG_API_URL}${path}`, { ...options, headers: { ...xpagHeaders(), ...options.headers }, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.message || data.error || `XPAG_HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function validateOrder(body) {
  const productPrice = catalog[body.service]?.[body.quantity];
  if (!productPrice) throw new Error("INVALID_PRODUCT");
  const bumps = Array.isArray(body.bumps) ? body.bumps : [];
  const bumpTotal = bumps.reduce((sum, bump) => {
    if (!allowedBumps[bump.id]) throw new Error("INVALID_BUMP");
    return sum + allowedBumps[bump.id];
  }, 0);
  return { productPrice, bumps, amount: productPrice + bumpTotal };
}

function validateCustomer(customer = {}) {
  const document = String(customer.document || "").trim().toUpperCase();
  const name = String(customer.name || "").trim();
  const email = String(customer.email || "").trim();
  const whatsapp = String(customer.whatsapp || "").replace(/\D/g, "");
  const profile = String(customer.profile || "").trim();
  const fields = {};
  if (!profile) fields.profile = "Ingresa el @ o enlace del perfil de Instagram.";
  if (name.length < 3) fields.name = "Ingresa tu nombre completo.";
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = "Ingresa un correo electrónico válido.";
  if (!/^[A-Z0-9]{12,18}$/.test(document)) fields.document = "Ingresa un RFC (12–13 caracteres) o CURP (18 caracteres) válido.";
  if (!/^\d{10}$/.test(whatsapp)) fields.whatsapp = "Ingresa un WhatsApp mexicano con 10 dígitos.";
  if (Object.keys(fields).length) {
    const error = new Error("INVALID_CUSTOMER");
    error.fields = fields;
    throw error;
  }
  return { name, email, document, whatsapp, profile };
}

app.get("/api/health", (_req, res) => res.json({ success: true, xpagConfigured: Boolean(process.env.XPAG_CLIENT_ID && process.env.XPAG_CLIENT_SECRET) }));

app.post("/api/payments/spei", async (req, res) => {
  try {
    const validated = validateOrder(req.body);
    const customer = validateCustomer(req.body.customer);
    const localOrderId = crypto.randomUUID();
    const webhookToken = process.env.XPAG_WEBHOOK_SECRET;
    if (!webhookToken) throw new Error("WEBHOOK_NOT_CONFIGURED");
    const webhookUrl = `${PUBLIC_BACKEND_URL}/api/webhooks/xpag?token=${encodeURIComponent(webhookToken)}`;
    const payment = await xpagRequest("/cashin", {
      method: "POST",
      body: JSON.stringify({ currency: "MXN", amount: validated.amount, name: customer.name, document: customer.document, description: `Pedido ${localOrderId}`, webhook_url: webhookUrl }),
    });
    const order = { id: localOrderId, requestNumber: payment.request_number, transactionId: payment.transaction_id, status: payment.status || "pending", amount: validated.amount, service: req.body.service, quantity: req.body.quantity, bumps: validated.bumps.map(({ id }) => id), customer, createdAt: new Date().toISOString() };
    orders.set(payment.request_number, order);
    res.status(201).json({ order_id: localOrderId, request_number: payment.request_number, status: order.status, amount: payment.amount ?? validated.amount, currency: "MXN", clabe: payment.clabe, reference: payment.reference });
  } catch (error) {
    const publicMessages = { INVALID_PRODUCT: "Produto ou preço inválido.", INVALID_BUMP: "Oferta adicional inválida.", INVALID_CUSTOMER: "Dados do cliente inválidos.", XPAG_NOT_CONFIGURED: "Gateway não configurado.", WEBHOOK_NOT_CONFIGURED: "Webhook não configurado." };
    console.error("SPEI creation failed:", error.message);
    const status = ["INVALID_PRODUCT", "INVALID_BUMP", "INVALID_CUSTOMER"].includes(error.message) ? 400 : 502;
    res.status(status).json({ error: publicMessages[error.message] || "Não foi possível gerar a cobrança SPEI.", ...(error.fields ? { fields: error.fields } : {}) });
  }
});

app.get("/api/payments/:requestNumber/status", async (req, res) => {
  try {
    const order = orders.get(req.params.requestNumber);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    const result = await xpagRequest(`/consult-transaction?request_number=${encodeURIComponent(req.params.requestNumber)}`);
    order.status = result.status || order.status;
    res.json({ request_number: order.requestNumber, status: order.status });
  } catch (error) {
    console.error("SPEI status failed:", error.message);
    res.status(502).json({ error: "Não foi possível consultar o pagamento." });
  }
});

app.get("/api/orders/:orderId", async (req, res) => {
  const order = [...orders.values()].find((item) => item.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado. Revisa el código e intenta nuevamente." });
  try {
    const result = await xpagRequest(`/consult-transaction?request_number=${encodeURIComponent(order.requestNumber)}`);
    order.status = result.status || order.status;
    order.updatedAt = new Date().toISOString();
  } catch (error) {
    console.error("Order tracking refresh failed:", error.message);
  }
  res.json({ order_id: order.id, status: order.status, service: order.service, quantity: order.quantity, amount: order.amount, created_at: order.createdAt, updated_at: order.updatedAt || null });
});

app.post("/api/webhooks/xpag", async (req, res) => {
  if (!process.env.XPAG_WEBHOOK_SECRET || req.query.token !== process.env.XPAG_WEBHOOK_SECRET) return res.sendStatus(401);
  const requestNumber = req.body?.request_number;
  const order = orders.get(requestNumber);
  if (!requestNumber || !order) return res.sendStatus(202);
  try {
    const verified = await xpagRequest(`/consult-transaction?request_number=${encodeURIComponent(requestNumber)}`);
    order.status = verified.status || order.status;
    order.updatedAt = new Date().toISOString();
    res.sendStatus(204);
  } catch (error) {
    console.error("Webhook verification failed:", error.message);
    res.sendStatus(502);
  }
});

app.listen(PORT, () => console.log(`Backend disponível na porta ${PORT}`));
