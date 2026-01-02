import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

async function usersCol() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db("mydatabase").collection("users");
}

export default async function handler(req, res) {
  const users = await usersCol();

  if (req.method === "GET") {
    const q = req.query.search;
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } }
          ]
        }
      : {};
    return res.json(await users.find(filter).toArray());
  }

  if (req.method === "POST") {
    const r = await users.insertOne(req.body);
    return res.json({ id: r.insertedId });
  }

  if (req.method === "PUT") {
    await users.updateOne(
      { _id: new ObjectId(req.query.id) },
      { $set: req.body }
    );
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    await users.deleteOne({ _id: new ObjectId(req.query.id) });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
