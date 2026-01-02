import clientPromise from "../lib/mongo.js";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("mydatabase");
  const config = db.collection("app_config");

  if (req.method === "GET") {
    const data = await config.findOne({ _id: "app_version" });
    return res.json(
      data || { version: "0.0.0", build: 0, full: "0.0.0(0)" }
    );
  }

  if (req.method === "POST") {
    const { version, build } = req.body;
    const full = `${version}(${build})`;

    await config.updateOne(
      { _id: "app_version" },
      { $set: { version, build, full, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.json({ full });
  }

  res.status(405).end();
}
