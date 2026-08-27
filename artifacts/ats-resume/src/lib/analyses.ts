/**
 * Multipart is intentionally kept outside generated Orval hooks: the shared
 * server validator runs in Node and cannot model a browser File object.
 */
export async function uploadAnalysis(file: File, jobDescription: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("jobDescription", jobDescription);
  const response = await fetch("/api/analyses", {
    method: "POST", body: form, credentials: "include",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(payload.error ?? "Upload failed");
  }
  return response.json();
}