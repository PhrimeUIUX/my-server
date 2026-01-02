import { gcs, APK_BUCKET, APK_FILENAME } from "../lib/gcs.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const [url] = await gcs
      .bucket(APK_BUCKET)
      .file(APK_FILENAME)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 10 * 60 * 1000,
        contentType: "application/vnd.android.package-archive"
      });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
}
