import { getStoredToken } from "@/lib/auth";
import type { CreateFeedingLogPayload, FeedingLog, UpdateFeedingLogPayload } from "@/types/feeding";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from "@/types/user";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.15:7000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getStoredToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Feeding logs
  getLogs: () => apiFetch<FeedingLog[]>("/api/feeding-logs"),

  getLog: (id: string) => apiFetch<FeedingLog>(`/api/feeding-logs/${id}`),

  createLog: (body: CreateFeedingLogPayload) =>
    apiFetch<FeedingLog>("/api/feeding-logs", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLog: (id: string, body: UpdateFeedingLogPayload) =>
    apiFetch<FeedingLog>(`/api/feeding-logs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteLog: (id: string) =>
    apiFetch<void>(`/api/feeding-logs/${id}`, { method: "DELETE" }),

  // Auth
  login: (body: LoginPayload) =>
    apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterPayload) =>
    apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // User profile
  getProfile: () => apiFetch<UserProfile>("/api/users/GetMyProfile"),

  updateProfile: (body: UpdateProfilePayload) =>
    apiFetch<UserProfile>("/api/users/UpdateMyProfile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
