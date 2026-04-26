import type { CreateFeedingLogPayload, FeedingLog, UpdateFeedingLogPayload } from "@/types/feeding";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from "@/types/user";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
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

  deleteLog: (id: string) => apiFetch<void>(`/api/feeding-logs/${id}`, { method: "DELETE" }),

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

  googleSignIn: (idToken: string) =>
    apiFetch<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  // User profile
  getProfile: (guidId: string) => apiFetch<UserProfile>(`/api/users/${guidId}/profile`),

  updateProfile: (guidId: string, body: UpdateProfilePayload) =>
    apiFetch<UserProfile>(`/api/users/${guidId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
