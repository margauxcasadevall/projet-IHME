import { appBasePath } from "./appData.js";

export async function api(path, options = {}) {
  const response = await fetch(`${appBasePath}api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || "Une erreur est survenue.");
    error.status = response.status;
    throw error;
  }
  return body;
}
