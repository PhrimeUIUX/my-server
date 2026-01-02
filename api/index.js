// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Storage } = require("@google-cloud/storage"); // ✅ ADD

const app = express();
app.use(cors());
app.use(express.json());

// ===== Multer for file uploading =====
const upload = multer();

// ===== Cloudflare R2 Client =====
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});

// ===== Google Cloud Storage (APK Upload) =====
const gcs = new Storage(); // uses GOOGLE_APPLICATION_CREDENTIALS from Render
const APK_BUCKET = "ppc-toda-apk";       // 🔴 CHANGE if different
const APK_FILENAME = "app-release.apk";  // 🔴 single filename = replace APK

// ===== MongoDB Connection =====
const uri =
  process.env.MONGO_URI ||
  "mongodb+srv://admin:password1234@pringles.xzpvaum.mongodb.net/?appName=Pringles";

const client = new MongoClient(uri);

let usersCollection;
let appConfigCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("mydatabase");

    usersCollection = db.collection("users");
    appConfigCollection = db.collection("app_config");

    console.log("MongoDB connected!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

// ===== IMAGE UPLOAD ROUTE (Cloudflare R2) =====
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const key = Date.now() + "-" + file.originalname;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    const imageUrl = `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}`;
    res.json({ url: imageUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ===== APK UPLOAD (Google Cloud Storage - SIGNED URL) =====
app.get("/apk-upload-url", async (req, res) => {
  try {
    const options = {
      version: "v4",
      action: "write",
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      contentType: "application/vnd.android.package-archive"
    };

    const [url] = await gcs
      .bucket(APK_BUCKET)
      .file(APK_FILENAME)
      .getSignedUrl(options);

    res.json({ url });
  } catch (err) {
    console.error("APK signed URL error:", err);
    res.status(500).json({ error: "Failed to generate APK upload URL" });
  }
});

// ===== GET ALL USERS (with search) =====
app.get("/users", async (req, res) => {
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

// ===== ADD USER =====
app.post("/users", async (req, res) => {
  const { name, age, email, city, image } = req.body;

  const result = await usersCollection.insertOne({
    name,
    age,
    email,
    city,
    image
  });

  res.json({ message: "User added", id: result.insertedId });
});

// ===== UPDATE USER =====
app.put("/users/:id", async (req, res) => {
  const id = req.params.id;
  const { name, age, email, city, image } = req.body;

  await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, age, email, city, image } }
  );

  res.json({ message: "User updated" });
});

// ===== DELETE USER =====
app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;

  await usersCollection.deleteOne({ _id: new ObjectId(id) });

  res.json({ message: "User deleted" });
});

// ===== GET APP VERSION =====
app.get("/app-version", async (req, res) => {
  const config = await appConfigCollection.findOne({ _id: "app_version" });

  if (!config) {
    return res.json({
      version: "0.0.0",
      build: 0,
      full: "0.0.0(0)"
    });
  }

  res.json(config);
});

// ===== UPDATE APP VERSION =====
app.post("/app-version", async (req, res) => {
  const { version, build } = req.body;

  if (!version || build === undefined) {
    return res.status(400).json({ error: "version and build required" });
  }

  const full = `${version}(${build})`;

  await appConfigCollection.updateOne(
    { _id: "app_version" },
    {
      $set: {
        version,
        build,
        full,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  res.json({ message: "App version updated", full });
});

// ===== START SERVER =====
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on port ${port}`)
);
