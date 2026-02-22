import cors from "cors";
import rateLimit from "express-rate-limit";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000"
];
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 120;
const DEFAULT_WRITE_RATE_LIMIT_MAX = 30;
const MAX_VIOLATIONS = 500;
const ALLOWED_VIOLATION_TYPES = new Set([
  "Red Light Jump",
  "Wrong Lane",
  "No Helmet",
  "Over Speed",
  "Illegal Parking"
]);

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

const violations = [];

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const apiRateLimitWindowMs = parsePositiveInteger(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_WINDOW_MS
);
const apiRateLimitMax = parsePositiveInteger(process.env.API_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX);
const apiWriteRateLimitMax = parsePositiveInteger(
  process.env.API_WRITE_LIMIT_MAX,
  DEFAULT_WRITE_RATE_LIMIT_MAX
);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        mediaSrc: ["'self'"],
        connectSrc: ["'self'"],
        "upgrade-insecure-requests": null
      }
    }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS_ORIGIN_DENIED"));
    },
    methods: ["GET", "POST", "OPTIONS"]
  })
);

app.use(express.json({ limit: "16kb", strict: true }));

app.use(
  "/api",
  rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many API requests. Please retry shortly." }
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CityVision API",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/violations", (_req, res) => {
  res.json(violations);
});

app.post(
  "/api/violations",
  rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiWriteRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many write requests. Please slow down." }
  }),
  (req, res) => {
    const validatedPayload = validateViolationPayload(req.body);

    if (validatedPayload.error) {
      res.status(400).json({ message: validatedPayload.error });
      return;
    }

    const { time, type, confidence } = validatedPayload.value;

    const newViolation = {
      id: randomUUID(),
      time,
      type,
      confidence,
      createdAt: new Date().toISOString()
    };

    violations.unshift(newViolation);
    if (violations.length > MAX_VIOLATIONS) {
      violations.length = MAX_VIOLATIONS;
    }

    res.status(201).json(newViolation);
  }
);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((error, _req, res, next) => {
  if (error?.message === "CORS_ORIGIN_DENIED") {
    res.status(403).json({ message: "Origin is not allowed by CORS policy." });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({ message: "Payload too large." });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({ message: "Malformed JSON payload." });
    return;
  }

  next(error);
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled API error:", error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CityVision server running at http://localhost:${port}`);
});

function parsePositiveInteger(rawValue, fallbackValue) {
  const parsedValue = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitizedValue = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!sanitizedValue || sanitizedValue.length > maxLength) {
    return null;
  }

  return sanitizedValue;
}

function validateViolationPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Payload must be a JSON object." };
  }

  const time = sanitizeText(payload.time, 32);
  const type = sanitizeText(payload.type, 40);
  const confidence = Number(payload.confidence);

  if (!time) {
    return { error: "Invalid time field." };
  }

  if (!type || !ALLOWED_VIOLATION_TYPES.has(type)) {
    return { error: "Invalid violation type." };
  }

  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    return { error: "Confidence must be a number between 0 and 100." };
  }

  return {
    value: {
      time,
      type,
      confidence: Number(confidence.toFixed(2))
    }
  };
}
