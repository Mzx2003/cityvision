import express from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

const violations = [];

app.use(express.json());

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

app.post("/api/violations", (req, res) => {
  const { time, type, confidence } = req.body ?? {};

  if (!time || !type || typeof confidence !== "number") {
    res.status(400).json({
      message: "Invalid violation payload. Expected: time, type, confidence(number)."
    });
    return;
  }

  const newViolation = {
    id: randomUUID(),
    time,
    type,
    confidence,
    createdAt: new Date().toISOString()
  };

  violations.unshift(newViolation);
  res.status(201).json(newViolation);
});

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CityVision server running at http://localhost:${port}`);
});
