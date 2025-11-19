// index.js
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());

// your mongo url
const uri = "mongodb+srv://admin:password1234@pringles.xzpvaum.mongodb.net/?appName=Pringles";

const client = new MongoClient(uri);

app.get("/data", async (req, res) => {
  try {
    await client.connect();

    const db = client.db("testdb");        // your database name
    const users = db.collection("users");  // your collection name

    const data = await users.find({}).toArray(); // fetch all documents

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));
