import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

async function configCol() {
  if (!client.topology?.isConnected()) await client.connect();
  return client.db("mydatabase").collection("app_config");
}

export default async function handler(req, res) {
  const col = await configCol();

  if (req.method === "GET") {
    const v = await col.findOne({ _id: "app_version" });
    return res.json(
      v || { version: "0.0.0", build: 0, full: "0.0.0(0)" }
    );
  }

  if (req.method === "POST") {
    const { version, build } = req.body;
    const full = `${version}(${build})`;

    await col.updateOne(
      { _id: "app_version" },
      { $set: { version, build, full, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.json({ full });
  }

  res.status(405).end();
}
