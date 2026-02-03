// Helpers for Local Storage (save/read/delete JSON securely).
export function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getJSON(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function removeKey(key) {
  localStorage.removeItem(key);
}
