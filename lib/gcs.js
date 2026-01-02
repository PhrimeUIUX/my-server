import { Storage } from "@google-cloud/storage";

export const gcs = new Storage({
  keyFilename: "/tmp/gcp-key.json"
});

export const APK_BUCKET = "ppc-toda-apk";      // CHANGE if needed
export const APK_FILENAME = "app-release.apk"; // SAME NAME = REPLACE APK

