const URLS = {
  auth: "https://functions.poehali.dev/63435bb3-58d3-4bd7-bc9d-0ae0fe7f311a",
  profile: "https://functions.poehali.dev/892b5bbb-ce1f-4765-af40-16042fea89e5",
  foodLog: "https://functions.poehali.dev/6e9cdcef-976e-45c3-93d8-1a7d86dc7fc6",
};

export const TOKEN_KEY = "diet_session_token";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const t = getToken();
  return t ? { "Content-Type": "application/json", "X-Session-Token": t } : { "Content-Type": "application/json" };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function apiRegister(email: string, password: string, name: string) {
  const r = await fetch(URLS.auth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", email, password, name }),
  });
  return r.json();
}

export async function apiLogin(email: string, password: string) {
  const r = await fetch(URLS.auth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email, password }),
  });
  return r.json();
}

export async function apiLogout() {
  await fetch(URLS.auth, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "logout" }),
  });
  clearToken();
}

export async function apiMe() {
  const r = await fetch(URLS.auth, { method: "GET", headers: authHeaders() });
  if (!r.ok) return null;
  return r.json();
}

// ── Profile ──────────────────────────────────────────────────────────────────
export async function apiGetProfile() {
  const r = await fetch(URLS.profile, { method: "GET", headers: authHeaders() });
  if (!r.ok) return null;
  return r.json();
}

export async function apiSaveProfile(data: object) {
  const r = await fetch(URLS.profile, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}

// ── Food log ─────────────────────────────────────────────────────────────────
export async function apiGetFoodLog(range = 30) {
  const r = await fetch(`${URLS.foodLog}?range=${range}`, { method: "GET", headers: authHeaders() });
  if (!r.ok) return {};
  return r.json();
}

export async function apiSaveFoodLogDay(date: string, entries: object[]) {
  const r = await fetch(URLS.foodLog, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date, entries }),
  });
  return r.json();
}
