import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({
  path: fileURLToPath(new URL(".env", import.meta.url)),
});

const app = express();

const PORT = Number(process.env.PORT || 3001);

const XPAG_API_URL =
  process.env.XPAG_API_URL || "https://api.xpag.global";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  "https://impulsatuperfil-5pza.vercel.app";

const PUBLIC_BACKEND_URL =
  process.env.PUBLIC_BACKEND_URL ||
  "https://impulsatuperfil-5pza.vercel.app";

const orders = new Map();

const catalog = {
  "Seguidores MX": {
    "1,000": 90,
    "3,000": 120,
    "5,000": 150,
    "10,000": 180,
    "15,000": 240,
    "20,000": 300,
    "40,000": 425,
    "50,000": 485,
    "100,000": 605,
  },

  "Me Gustas MX": {
    "100": 25,
    "500": 45,
    "1,000": 70,
    "3,000": 120,
    "5,000": 165,
    "10,000": 260,
  },

  Reproducciones: {
    "1,000": 20,
    "5,000": 45,
    "10,000": 70,
    "25,000": 120,
    "50,000": 180,
    "100,000": 290,
  },

  "Comentarios MX": {
    "10": 35,
    "25": 65,
    "50": 110,
    "100": 190,
    "250": 390,
    "500": 690,
  },
};

const allowedBumps = {
  likes: 42,
  views: 60,
  comments: 60,
};

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = [
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:3000",
      ];

      // Permite chamadas sem Origin, como curl e chamadas internas
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin não permitida pelo CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "32kb" }));

function xpagHeaders() {
  if (
    !process.env.XPAG_CLIENT_ID ||
    !process.env.XPAG_CLIENT_SECRET
  ) {
    throw new Error("XPAG_NOT_CONFIGURED");
  }

  return {
    "Content-Type": "application/json",
    "X-Client-Id": process.env.XPAG_CLIENT_ID,
    "X-Client-Secret": process.env.XPAG_CLIENT_SECRET,
  };
}

async function xpagRequest(path, options = {}) {
  const response = await fetch(`${XPAG_API_URL}${path}`, {
    ...options,
    headers: {
      ...xpagHeaders(),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();

  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = {
      message: responseText || "Resposta inválida da XPAG",
    };
  }

  if (!response.ok || data.ok === false) {
    const error = new Error(
      data.message ||
        data.error ||
        `XPAG_HTTP_${response.status}`
    );

    error.status = response.status;
    error.details = data;

    throw error;
  }

  return data;
}

function validateOrder(body = {}) {
  const productPrice = catalog[body.service]?.[body.quantity];

  if (!productPrice) {
    throw new Error("INVALID_PRODUCT");
  }

  const bumps = Array.isArray(body.bumps) ? body.bumps : [];

  const bumpTotal = bumps.reduce((sum, bump) => {
    if (!bump?.id || !allowedBumps[bump.id]) {
      throw new Error("INVALID_BUMP");
    }

    return sum + allowedBumps[bump.id];
  }, 0);

  return {
    productPrice,
    bumps,
    amount: productPrice + bumpTotal,
  };
}

function validateCustomer(customer = {}) {
  const document = String(customer.document || "")
    .trim()
    .toUpperCase();

  const name = String(customer.name || "").trim();
  const email = String(customer.email || "").trim();

  const whatsapp = String(customer.whatsapp || "").replace(
    /\D/g,
    ""
  );

  const profile = String(customer.profile || "").trim();

  const fields = {};

  if (!profile) {
    fields.profile =
      "Ingresa el @ o enlace del perfil de Instagram.";
  }

  if (name.length < 3) {
    fields.name = "Ingresa tu nombre completo.";
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    fields.email =
      "Ingresa un correo electrónico válido.";
  }

  if (!/^[A-Z0-9]{12,18}$/.test(document)) {
    fields.document =
      "Ingresa un RFC de 12–13 caracteres o CURP de 18 caracteres válido.";
  }

  if (!/^\d{10}$/.test(whatsapp)) {
    fields.whatsapp =
      "Ingresa un WhatsApp mexicano con 10 dígitos.";
  }

  if (Object.keys(fields).length > 0) {
    const error = new Error("INVALID_CUSTOMER");
    error.fields = fields;
    throw error;
  }

  return {
    name,
    email,
    document,
    whatsapp,
    profile,
  };
}

/**
 * Teste da API
 */
app.get("/api/health", (_req, res) => {
  res.json({
  success: true,
  clientId: process.env.XPAG_CLIENT_ID || "NÃO EXISTE",
  clientSecret: process.env.XPAG_CLIENT_SECRET ? "OK" : "NÃO EXISTE",
  webhook: process.env.XPAG_WEBHOOK_SECRET || "NÃO EXISTE",
});
});

/**
 * Rota alternativa para teste no navegador
 */
app.get("/api/spei", (_req, res) => {
  return res.json({
    success: true,
    message:
      "Rota SPEI online. Utilize POST /api/spei para criar o pagamento.",
  });
});

/**
 * Criação de pagamento SPEI
 *
 * Agora aceita:
 * POST /api/spei
 * POST /api/payments/spei
 */
async function createSpeiPayment(req, res) {
  try {
    const validated = validateOrder(req.body);
    const customer = validateCustomer(req.body.customer);

    const localOrderId = crypto.randomUUID();
    const webhookToken = process.env.XPAG_WEBHOOK_SECRET;

    if (!webhookToken) {
      throw new Error("WEBHOOK_NOT_CONFIGURED");
    }

    const webhookUrl =
      `${PUBLIC_BACKEND_URL}/api/webhooks/xpag` +
      `?token=${encodeURIComponent(webhookToken)}`;

    const payment = await xpagRequest("/cashin", {
      method: "POST",
      body: JSON.stringify({
        currency: "MXN",
        amount: validated.amount,
        name: customer.name,
        document: customer.document,
        description: `Pedido ${localOrderId}`,
        webhook_url: webhookUrl,
      }),
    });

    const order = {
      id: localOrderId,
      requestNumber: payment.request_number,
      transactionId: payment.transaction_id,
      status: payment.status || "pending",
      amount: validated.amount,
      service: req.body.service,
      quantity: req.body.quantity,
      bumps: validated.bumps.map(({ id }) => id),
      customer,
      createdAt: new Date().toISOString(),
    };

    orders.set(payment.request_number, order);

    return res.status(201).json({
      success: true,
      order_id: localOrderId,
      request_number: payment.request_number,
      transaction_id: payment.transaction_id,
      status: order.status,
      amount: payment.amount ?? validated.amount,
      currency: "MXN",
      clabe: payment.clabe,
      reference: payment.reference,
    });
  } catch (error) {
    const publicMessages = {
      INVALID_PRODUCT: "Produto ou preço inválido.",
      INVALID_BUMP: "Oferta adicional inválida.",
      INVALID_CUSTOMER: "Dados do cliente inválidos.",
      XPAG_NOT_CONFIGURED: "Gateway XPAG não configurado.",
      WEBHOOK_NOT_CONFIGURED: "Webhook não configurado.",
    };

    console.error("SPEI creation failed:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });

    const validationErrors = [
      "INVALID_PRODUCT",
      "INVALID_BUMP",
      "INVALID_CUSTOMER",
    ];

    const configurationErrors = [
      "XPAG_NOT_CONFIGURED",
      "WEBHOOK_NOT_CONFIGURED",
    ];

    let status = 502;

    if (validationErrors.includes(error.message)) {
      status = 400;
    }

    if (configurationErrors.includes(error.message)) {
      status = 500;
    }

    return res.status(status).json({
      success: false,
      error:
        publicMessages[error.message] ||
        error.message ||
        "Não foi possível gerar a cobrança SPEI.",

      ...(error.fields
        ? {
            fields: error.fields,
          }
        : {}),
    });
  }
}

app.post("/api/spei", createSpeiPayment);
app.post("/api/payments/spei", createSpeiPayment);

/**
 * Consulta por request_number
 */
app.get(
  "/api/payments/:requestNumber/status",
  async (req, res) => {
    try {
      const order = orders.get(req.params.requestNumber);

      if (!order) {
        return res.status(404).json({
          error: "Pedido não encontrado.",
        });
      }

      const result = await xpagRequest(
        `/consult-transaction?request_number=${encodeURIComponent(
          req.params.requestNumber
        )}`
      );

      order.status = result.status || order.status;
      order.updatedAt = new Date().toISOString();

      return res.json({
        request_number: order.requestNumber,
        status: order.status,
      });
    } catch (error) {
      console.error("SPEI status failed:", error.message);

      return res.status(502).json({
        error: "Não foi possível consultar o pagamento.",
      });
    }
  }
);

/**
 * Consulta do pedido local
 */
app.get("/api/orders/:orderId", async (req, res) => {
  const order = [...orders.values()].find(
    (item) => item.id === req.params.orderId
  );

  if (!order) {
    return res.status(404).json({
      error:
        "Pedido no encontrado. Revisa el código e intenta nuevamente.",
    });
  }

  try {
    const result = await xpagRequest(
      `/consult-transaction?request_number=${encodeURIComponent(
        order.requestNumber
      )}`
    );

    order.status = result.status || order.status;
    order.updatedAt = new Date().toISOString();
  } catch (error) {
    console.error(
      "Order tracking refresh failed:",
      error.message
    );
  }

  return res.json({
    order_id: order.id,
    status: order.status,
    service: order.service,
    quantity: order.quantity,
    amount: order.amount,
    created_at: order.createdAt,
    updated_at: order.updatedAt || null,
  });
});

/**
 * Webhook XPAG
 */
app.post("/api/webhooks/xpag", async (req, res) => {
  if (
    !process.env.XPAG_WEBHOOK_SECRET ||
    req.query.token !== process.env.XPAG_WEBHOOK_SECRET
  ) {
    return res.sendStatus(401);
  }

  const requestNumber = req.body?.request_number;
  const order = orders.get(requestNumber);

  if (!requestNumber || !order) {
    return res.sendStatus(202);
  }

  try {
    const verified = await xpagRequest(
      `/consult-transaction?request_number=${encodeURIComponent(
        requestNumber
      )}`
    );

    order.status = verified.status || order.status;
    order.updatedAt = new Date().toISOString();

    return res.sendStatus(204);
  } catch (error) {
    console.error(
      "Webhook verification failed:",
      error.message
    );

    return res.sendStatus(502);
  }
});

/**
 * Executa app.listen apenas localmente.
 * Na Vercel, o app é exportado abaixo.
 */
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `Backend disponível em http://localhost:${PORT}`
    );
  });
}

export default app;