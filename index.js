// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON

// ===== Multer for file uploading =====
const upload = multer();

// ===== Cloudflare R2 Client =====
// Make sure ENV variables exist in Render:
// CF_ACCOUNT_ID
// R2_ACCESS_KEY
// R2_SECRET_KEY
// R2_BUCKET_NAME  → example: pub-8010fa08735c45f79ee14c0a5a6e3880
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});

// ===== MongoDB Connection =====
const uri = process.env.MONGO_URI || "mongodb+srv://admin:password1234@pringles.xzpvaum.mongodb.net/?appName=Pringles";
const client = new MongoClient(uri);

let usersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("mydatabase");
    usersCollection = db.collection("users");
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
    image // <- save image URL to MongoDB
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

// ===== START SERVER =====
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
