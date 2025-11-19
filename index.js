// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // IMPORTANT for reading JSON body

// --- MongoDB Connection ---
const uri = "mongodb+srv://admin:password1234@pringles.xzpvaum.mongodb.net/?appName=Pringles"; 
const client = new MongoClient(uri);

let usersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("mydatabase"); // you can rename this
    usersCollection = db.collection("users");
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB();

// --- ROUTES ---

// GET ALL USERS / SEARCH USERS
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

// ADD USER
app.post("/users", async (req, res) => {
  const { name, age, email, city } = req.body;

  const result = await usersCollection.insertOne({
    name,
    age,
    email,
    city
  });

  res.json({ message: "User added", id: result.insertedId });
});

// UPDATE USER
app.put("/users/:id", async (req, res) => {
  const id = req.params.id;
  const { name, age, email, city } = req.body;

  await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, age, email, city } }
  );

  res.json({ message: "User updated" });
});

// DELETE USER
app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;

  await usersCollection.deleteOne({ _id: new ObjectId(id) });

  res.json({ message: "User deleted" });
});

// --- SERVER LISTEN ---
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));
