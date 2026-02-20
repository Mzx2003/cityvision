import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const hasFrontendBuild = fs.existsSync(frontendDistPath);

app.use(cors());
app.use(express.json());

const activeTokens = new Map();

let settings = {
  enableSpeedViolation: true,
  enableLaneViolation: true
};

const vehicleClasses = ["Car", "Truck", "Bus", "Motorcycle"];
const lanes = ["Lane 1", "Lane 2", "Lane 3"];
const violationTypes = ["None", "Speeding", "Lane Departure", "Speeding + Lane"];

let detectionIdCounter = 0;
const detections = [];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDetection(timestamp = new Date()) {
  detectionIdCounter += 1;

  const lane = randomFrom(lanes);
  const laneIndex = lanes.indexOf(lane);
  const speed = randomInt(35, 105);

  const laneXStart = laneIndex * 33.3;
  const width = randomFloat(12, 18);
  const x = Math.min(laneXStart + randomFloat(4, 12), 100 - width);
  const y = randomFloat(30, 72);
  const violationType = speed > 72 ? randomFrom(["Speeding", "Speeding + Lane"]) : randomFrom(violationTypes);

  return {
    id: detectionIdCounter,
    time: timestamp.toISOString(),
    class: randomFrom(vehicleClasses),
    confidence: Number(randomFloat(0.72, 0.98).toFixed(2)),
    lane,
    speed,
    violationType,
    box: {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      width: Number(width.toFixed(1)),
      height: Number(randomFloat(14, 24).toFixed(1))
    }
  };
}

function seedDetections() {
  for (let i = 8; i >= 1; i -= 1) {
    const timestamp = new Date(Date.now() - i * 12_000);
    detections.unshift(createDetection(timestamp));
  }
}

seedDetections();

function addDetection() {
  detections.unshift(createDetection());
  if (detections.length > 60) {
    detections.length = 60;
  }
}

setInterval(addDetection, 4_000).unref();

function parseToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

function requireAuth(req, res, next) {
  const token = parseToken(req);
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.token = token;
  req.username = activeTokens.get(token);
  return next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const providedUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const username = providedUsername || "Operator";
  const token = randomUUID();

  activeTokens.set(token, username);

  res.json({
    loggedIn: true,
    token,
    username
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  activeTokens.delete(req.token);
  res.json({ loggedOut: true });
});

app.get("/api/detections", requireAuth, (_req, res) => {
  res.json({
    detections: detections.slice(0, 20)
  });
});

app.get("/api/settings", requireAuth, (_req, res) => {
  res.json(settings);
});

app.put("/api/settings", requireAuth, (req, res) => {
  const nextSettings = req.body || {};

  settings = {
    ...settings,
    enableSpeedViolation: Boolean(nextSettings.enableSpeedViolation),
    enableLaneViolation: Boolean(nextSettings.enableLaneViolation)
  };

  res.json(settings);
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.status(503).send("Frontend build not found. Run `npm run build` from the project root.");
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CityVision backend running on http://localhost:${PORT}`);
});
