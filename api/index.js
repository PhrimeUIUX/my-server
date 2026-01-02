const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

/* ================= CORS (MUST BE FIRST) ================= */
app.use(
  cors({
    origin: "https://ppctoda.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Handle preflight requests (CRITICAL for Vercel)
app.options("*", cors());

/* ================= MIDDLEWARE ================= */
app.use(express.json());

/* ================= MONGODB ================= */
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let usersCollection;
let appConfigCollection;

async function connectDB() {
  if (usersCollection) return;

  await client.connect();
  const db = client.db("mydatabase");
  usersCollection = db.collection("users");
  appConfigCollection = db.collection("app_config");
}
connectDB();

/* ================= USERS ================= */
app.get("/api/users", async (req, res) => {
  await connectDB();
  const search = req.query.search;

  let filter = {};
  if (search) {
    filter = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    };
  }

  const users = await usersCollection.find(filter).toArray();
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  await connectDB();
  const { name, age, email, city } = req.body;
  const r = await usersCollection.insertOne({ name, age, email, city });
  res.json({ id: r.insertedId });
});

app.put("/api/users/:id", async (req, res) => {
  await connectDB();
  await usersCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.json({ success: true });
});

app.delete("/api/users/:id", async (req, res) => {
  await connectDB();
  await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

/* ================= APP VERSION ================= */
app.get("/api/app-version", async (req, res) => {
  await connectDB();
  const cfg = await appConfigCollection.findOne({ _id: "app_version" });
  res.json(
    cfg || { version: "0.0.0", build: 0, full: "0.0.0(0)" }
  );
});

app.post("/api/app-version", async (req, res) => {
  await connectDB();
  const { version, build } = req.body;
  const full = `${version}(${build})`;

  await appConfigCollection.updateOne(
    { _id: "app_version" },
    { $set: { version, build, full, updatedAt: new Date() } },
    { upsert: true }
  );

  res.json({ full });
});

/* ================= EXPORT (NO LISTEN) ================= */
module.exports = app;
