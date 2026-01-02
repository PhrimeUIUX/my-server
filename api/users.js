import clientPromise from "../lib/mongo.js";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");

  if (req.method === "GET") {
    const search = req.query.search;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    return res.json(await users.find(filter).toArray());
  }

  if (req.method === "POST") {
    const result = await users.insertOne(req.body);
    return res.json({ id: result.insertedId });
  }

  res.status(405).end();
}
