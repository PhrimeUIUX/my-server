import { r2 } from "../lib/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buffer = Buffer.from(await req.arrayBuffer());
  const key = Date.now() + ".jpg";

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: req.headers["content-type"]
    })
  );

  res.json({
    url: `https://${process.env.R2_BUCKET_NAME}.r2.dev/${key}`
  });
}
