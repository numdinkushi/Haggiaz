/**
 * Server-only Cloudinary upload helper using the REST API.
 * No external cloudinary package — uses env vars and fetch/crypto only.
 */

import { createHash } from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

function getConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
  return { cloudName, apiKey, apiSecret };
}

/**
 * Generate signed upload params for Cloudinary (folder + timestamp).
 * Signature = SHA1(sorted_params_string + api_secret).
 */
function getUploadSignature(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params).sort();
  const paramString = sorted.map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(paramString + apiSecret).digest("hex");
}

/**
 * Upload an image buffer to Cloudinary (e.g. profile picture).
 * @param buffer - Image file buffer
 * @param mimeType - e.g. "image/jpeg"
 * @param folder - Optional folder (e.g. "profiles")
 * @returns Secure URL of the uploaded image
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder = "profiles"
): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params: Record<string, string> = { folder, timestamp };
  const signature = getUploadSignature(params, apiSecret);

  const formData = new FormData();
  formData.set("file", `data:${mimeType};base64,${buffer.toString("base64")}`);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("signature", signature);
  formData.set("folder", folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Upload failed: ${res.status}`);
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
