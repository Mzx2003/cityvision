import type { Detection, Settings } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  token?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const message =
      typeof errorPayload?.message === "string" ? errorPayload.message : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export interface LoginResponse {
  loggedIn: boolean;
  token: string;
  username: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password }
  });
}

export async function logout(token: string): Promise<void> {
  await request<{ loggedOut: boolean }>("/api/auth/logout", {
    method: "POST",
    token
  });
}

export async function getDetections(token: string): Promise<Detection[]> {
  const payload = await request<{ detections: Detection[] }>("/api/detections", { token });
  return payload.detections;
}

export async function getSettings(token: string): Promise<Settings> {
  return request<Settings>("/api/settings", { token });
}

export async function updateSettings(token: string, settings: Settings): Promise<Settings> {
  return request<Settings>("/api/settings", {
    method: "PUT",
    token,
    body: settings
  });
}
