import clientPromise from "../lib/mongo.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");
  const id = req.query.id;

  if (req.method === "PUT") {
    await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );
    return res.json({ message: "Updated" });
  }

  if (req.method === "DELETE") {
    await users.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: "Deleted" });
  }

  res.status(405).end();
}
