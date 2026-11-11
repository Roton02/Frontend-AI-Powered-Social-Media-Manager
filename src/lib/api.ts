const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TOKEN_KEY = "pitret_token";
const WORKSPACE_KEY = "pitret_workspace_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WORKSPACE_KEY);
}

export function setWorkspaceId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKSPACE_KEY, id);
}

export function clearWorkspaceId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORKSPACE_KEY);
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  workspace?: boolean;
  token?: string | null;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, workspace = false, token } = options;

  const headers: Record<string, string> = {};
  const authToken = token ?? getToken();
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (workspace) {
    const wsId = getWorkspaceId();
    if (wsId) headers["x-workspace-id"] = wsId;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.success === false) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return json.result as T;
}

export const api = {
  get: <T>(path: string, opts: Omit<ApiOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts: Omit<ApiOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts: Omit<ApiOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
