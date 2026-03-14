/**
 * Client-side profile image upload. POSTs file to API and returns the image URL.
 */

export async function uploadProfileImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch("/api/upload/profile", {
    method: "POST",
    body: formData,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data.url;
}
