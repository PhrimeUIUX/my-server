import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  keyFilename: "/tmp/gcp-key.json"
});

export default async function handler(req, res) {
  const [url] = await storage
    .bucket("ppc-toda-apk")
    .file("app-release.apk")
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 10 * 60 * 1000,
      contentType: "application/vnd.android.package-archive"
    });

  res.json({ url });
}
