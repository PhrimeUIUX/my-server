const express = require("express");

const app = express();

/* ===== CORS (SAFE & WORKING) ===== */
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://ppctoda.vercel.app"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

/* ===== ROUTES ===== */

app.get("/api/app-version", (req, res) => {
  res.json({
    version: "1.0.0",
    build: 1,
    full: "1.0.0 (1)"
  });
});

app.get("/api/users", (req, res) => {
  res.json([]);
});

/* ===== EXPORT (NO app.listen!) ===== */
module.exports = app;
