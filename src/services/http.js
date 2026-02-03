// Centralized HTTP client with fetch + try/catch.
import { API_BASE_URL } from "../constants/config.js";

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      const msg = data?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    // We relaunched it to manage it up (router/views).
    throw err;
  }
}

export const http = {
  get: (p) => request(p, { method: "GET" }),
  post: (p, b) => request(p, { method: "POST", body: JSON.stringify(b) }),
  put: (p, b) => request(p, { method: "PUT", body: JSON.stringify(b) }),
  patch: (p, b) => request(p, { method: "PATCH", body: JSON.stringify(b) }),
  del: (p) => request(p, { method: "DELETE" })
};
