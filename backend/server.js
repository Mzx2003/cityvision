import cors from "cors";
import rateLimit from "express-rate-limit";
import express from "express";
import helmet from "helmet";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
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
const DEFAULT_LOGIN_ROUTE_RATE_LIMIT_MAX = 20;
const DEFAULT_LOGIN_MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_LOGIN_BLOCK_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEFAULT_RECAPTCHA_MIN_SCORE = 0.5;
const DEFAULT_RECAPTCHA_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
const RECAPTCHA_VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";
const MAX_VIOLATIONS = 500;
const MAX_FAILED_LOGIN_LOGS = 200;
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
const authSessions = new Map();
const failedLoginAttempts = new Map();
const failedLoginEvents = [];

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
const loginRouteRateLimitMax = parsePositiveInteger(
  process.env.LOGIN_ROUTE_RATE_LIMIT_MAX,
  DEFAULT_LOGIN_ROUTE_RATE_LIMIT_MAX
);
const loginMaxFailedAttempts = parsePositiveInteger(
  process.env.LOGIN_MAX_FAILED_ATTEMPTS,
  DEFAULT_LOGIN_MAX_FAILED_ATTEMPTS
);
const loginBlockWindowMs = parsePositiveInteger(
  process.env.LOGIN_BLOCK_WINDOW_MS,
  DEFAULT_LOGIN_BLOCK_WINDOW_MS
);
const authSessionTtlMs = parsePositiveInteger(process.env.AUTH_SESSION_TTL_MS, DEFAULT_AUTH_SESSION_TTL_MS);
const recaptchaSecretKey = (process.env.RECAPTCHA_SECRET_KEY ?? DEFAULT_RECAPTCHA_SECRET_KEY).trim();
const recaptchaExpectedAction = (process.env.RECAPTCHA_EXPECTED_ACTION ?? "").trim();
const recaptchaMinScore = parseBoundedFloat(
  process.env.RECAPTCHA_MIN_SCORE,
  DEFAULT_RECAPTCHA_MIN_SCORE,
  0,
  1
);
const recaptchaAllowedHostnames = new Set(
  (process.env.RECAPTCHA_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean)
);
const demoLoginUsername = sanitizeText(process.env.DEMO_LOGIN_USERNAME ?? "admin", 64) ?? "admin";
const demoLoginPassword = process.env.DEMO_LOGIN_PASSWORD ?? "CityVision@123";

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
        scriptSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com/recaptcha/"],
        imgSrc: [
          "'self'",
          "data:",
          "https://www.google.com/recaptcha/",
          "https://www.gstatic.com/recaptcha/"
        ],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.google.com/recaptcha/", "https://recaptcha.google.com/recaptcha/"],
        connectSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
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

app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: loginRouteRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many login requests. Please retry shortly." }
  }),
  async (req, res) => {
    cleanupExpiredSessions();
    cleanupExpiredFailedLoginAttempts();

    const validatedPayload = validateLoginPayload(req.body);
    if (validatedPayload.error) {
      res.status(400).json({ message: validatedPayload.error });
      return;
    }

    const { username, password, captchaToken } = validatedPayload.value;
    const clientIp = getClientIp(req);
    const attemptKey = buildLoginAttemptKey(clientIp, username);

    const activeAttemptState = failedLoginAttempts.get(attemptKey);
    const now = Date.now();
    if (activeAttemptState?.blockedUntilMs && activeAttemptState.blockedUntilMs > now) {
      const retryAfterSeconds = Math.ceil((activeAttemptState.blockedUntilMs - now) / 1000);
      appendFailedLoginEvent({
        username,
        clientIp,
        reason: "blocked_temporarily",
        failureCount: activeAttemptState.failureCount,
        blockedUntilMs: activeAttemptState.blockedUntilMs
      });
      res.status(429).json({
        message: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`
      });
      return;
    }

    const captchaVerification = await verifyCaptchaToken({
      token: captchaToken,
      clientIp
    });

    if (!captchaVerification.valid) {
      const nextState = recordFailedLoginAttempt({
        attemptKey,
        username,
        clientIp,
        reason: `captcha_failed:${captchaVerification.reason}`
      });
      if (nextState.blockedUntilMs > Date.now()) {
        const retryAfterSeconds = Math.ceil((nextState.blockedUntilMs - Date.now()) / 1000);
        res.status(429).json({
          message: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`
        });
        return;
      }

      res.status(401).json({ message: "CAPTCHA verification failed. Please try again." });
      return;
    }

    if (!constantTimeEquals(username, demoLoginUsername) || !constantTimeEquals(password, demoLoginPassword)) {
      const nextState = recordFailedLoginAttempt({
        attemptKey,
        username,
        clientIp,
        reason: "invalid_credentials"
      });
      if (nextState.blockedUntilMs > Date.now()) {
        const retryAfterSeconds = Math.ceil((nextState.blockedUntilMs - Date.now()) / 1000);
        res.status(429).json({
          message: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`
        });
        return;
      }

      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    failedLoginAttempts.delete(attemptKey);

    const sessionToken = randomBytes(48).toString("base64url");
    const expiresAtMs = Date.now() + authSessionTtlMs;
    authSessions.set(sessionToken, {
      username,
      issuedAtMs: Date.now(),
      expiresAtMs,
      clientIp
    });

    res.json({
      token: sessionToken,
      username,
      expiresAt: new Date(expiresAtMs).toISOString()
    });
  }
);

app.get("/api/auth/me", authenticateRequest, (req, res) => {
  res.json({
    username: req.auth.username,
    expiresAt: new Date(req.auth.expiresAtMs).toISOString()
  });
});

app.post("/api/auth/logout", authenticateRequest, (req, res) => {
  authSessions.delete(req.auth.token);
  res.json({ message: "Logged out." });
});

app.get("/api/security/failed-logins", authenticateRequest, (_req, res) => {
  res.json(failedLoginEvents);
});

app.get("/api/violations", authenticateRequest, (_req, res) => {
  res.json(violations);
});

app.post(
  "/api/violations",
  authenticateRequest,
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

function parseBoundedFloat(rawValue, fallbackValue, min, max) {
  const parsedValue = Number.parseFloat(rawValue ?? "");
  if (!Number.isFinite(parsedValue) || parsedValue < min || parsedValue > max) {
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

function validateLoginPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Payload must be a JSON object." };
  }

  const username = sanitizeText(payload.username, 64);
  const captchaToken = sanitizeText(payload.captchaToken, 4096);
  const password = typeof payload.password === "string" ? payload.password : null;

  if (!username) {
    return { error: "Username is required." };
  }

  if (!password || password.length > 128) {
    return { error: "Password is required." };
  }

  if (!captchaToken) {
    return { error: "CAPTCHA token is required." };
  }

  return {
    value: {
      username,
      password,
      captchaToken
    }
  };
}

function buildLoginAttemptKey(clientIp, username) {
  return `${clientIp}:${username.toLowerCase()}`;
}

function recordFailedLoginAttempt({ attemptKey, username, clientIp, reason }) {
  const now = Date.now();
  const previous = failedLoginAttempts.get(attemptKey);

  const isWithinBlockWindow =
    previous && now - previous.firstFailureAtMs <= loginBlockWindowMs && now - previous.lastFailureAtMs <= loginBlockWindowMs;
  const failureCount = isWithinBlockWindow ? previous.failureCount + 1 : 1;
  const firstFailureAtMs = isWithinBlockWindow ? previous.firstFailureAtMs : now;
  const blockedUntilMs = failureCount >= loginMaxFailedAttempts ? now + loginBlockWindowMs : 0;

  const nextState = {
    failureCount,
    firstFailureAtMs,
    lastFailureAtMs: now,
    blockedUntilMs
  };
  failedLoginAttempts.set(attemptKey, nextState);

  appendFailedLoginEvent({
    username,
    clientIp,
    reason,
    failureCount,
    blockedUntilMs
  });

  return nextState;
}

function appendFailedLoginEvent({ username, clientIp, reason, failureCount, blockedUntilMs }) {
  const event = {
    timestamp: new Date().toISOString(),
    username,
    clientIp,
    reason,
    failureCount,
    blockedUntil: blockedUntilMs ? new Date(blockedUntilMs).toISOString() : null
  };
  failedLoginEvents.unshift(event);
  if (failedLoginEvents.length > MAX_FAILED_LOGIN_LOGS) {
    failedLoginEvents.length = MAX_FAILED_LOGIN_LOGS;
  }

  // eslint-disable-next-line no-console
  console.warn("[SECURITY] Failed login attempt", event);
}

function cleanupExpiredFailedLoginAttempts() {
  const now = Date.now();

  for (const [key, state] of failedLoginAttempts.entries()) {
    const expiredByInactivity = now - state.lastFailureAtMs > loginBlockWindowMs;
    const blockExpiredAndInactive =
      state.blockedUntilMs > 0 && state.blockedUntilMs <= now && now - state.lastFailureAtMs > loginBlockWindowMs;

    if (expiredByInactivity || blockExpiredAndInactive) {
      failedLoginAttempts.delete(key);
    }
  }
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of authSessions.entries()) {
    if (session.expiresAtMs <= now) {
      authSessions.delete(token);
    }
  }
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip ?? "unknown";
}

function authenticateRequest(req, res, next) {
  cleanupExpiredSessions();

  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  const session = authSessions.get(token);
  if (!session || session.expiresAtMs <= Date.now()) {
    authSessions.delete(token);
    res.status(401).json({ message: "Session expired or invalid." });
    return;
  }

  req.auth = {
    token,
    username: session.username,
    expiresAtMs: session.expiresAtMs
  };

  next();
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string" || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token || null;
}

function constantTimeEquals(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

async function verifyCaptchaToken({ token, clientIp }) {
  if (!recaptchaSecretKey) {
    return { valid: false, reason: "missing_secret_key" };
  }

  const requestBody = new URLSearchParams();
  requestBody.append("secret", recaptchaSecretKey);
  requestBody.append("response", token);
  requestBody.append("remoteip", clientIp);

  let response;
  try {
    response = await fetch(RECAPTCHA_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: requestBody.toString()
    });
  } catch {
    return { valid: false, reason: "captcha_service_unreachable" };
  }

  if (!response.ok) {
    return { valid: false, reason: "captcha_service_error" };
  }

  const verificationResult = await response.json();
  if (!verificationResult.success) {
    return { valid: false, reason: "captcha_invalid_token" };
  }

  if (
    typeof verificationResult.score === "number" &&
    verificationResult.score < recaptchaMinScore
  ) {
    return { valid: false, reason: "captcha_low_score" };
  }

  if (
    recaptchaExpectedAction &&
    typeof verificationResult.action === "string" &&
    verificationResult.action !== recaptchaExpectedAction
  ) {
    return { valid: false, reason: "captcha_invalid_action" };
  }

  if (recaptchaAllowedHostnames.size > 0) {
    const verificationHostname = String(verificationResult.hostname ?? "").toLowerCase();
    if (!verificationHostname || !recaptchaAllowedHostnames.has(verificationHostname)) {
      return { valid: false, reason: "captcha_invalid_hostname" };
    }
  }

  return { valid: true };
}
