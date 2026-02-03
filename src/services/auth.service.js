// Auth + session (memory + Local Storage) with admin/user roles.
import { STORAGE_KEYS } from "../constants/config.js";
import { getJSON, removeKey, setJSON } from "../helpers/storage.js";
import { http } from "./http.js";

let session = getJSON(STORAGE_KEYS.SESSION, null);

export function isAuthenticated() {
  return Boolean(session && session.user);
}

export function getUser() {
  return session?.user ?? null;
}

export function getRole() {
  return session?.user?.role ?? null;
}

export function setSession(next) {
  session = next;
  setJSON(STORAGE_KEYS.SESSION, next);
}

export function clearSession() {
  session = null;
  removeKey(STORAGE_KEYS.SESSION);
}

export async function loginWithEmail(email, password) {
  const users = await http.get(`/users?email=${encodeURIComponent(email)}`);
  const user = users?.[0];

  if (!user) throw new Error("Invalid credentials.");
  if (user.password !== password) throw new Error("Invalid credentials.");

  setSession({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });

  return user;
}

export async function registerUser({ name, email, password }) {
  // The "user" role is always assigned in the registry.
  const existing = await http.get(`/users?email=${encodeURIComponent(email)}`);
  if (existing.length > 0) throw new Error("Email already exists.");

  const created = await http.post("/users", {
    name,
    email,
    password,
    role: "user",
    createdAt: new Date().toISOString()
  });

  return created;
}

export function logout() {
  clearSession();
}