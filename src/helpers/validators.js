// Reusable validations for forms.
export function isEmpty(v) {
  return String(v ?? "").trim().length === 0;
}

export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());
}

export function minLength(v, n) {
  return String(v ?? "").trim().length >= n;
}
