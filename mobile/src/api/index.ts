import { getStoredToken } from "@/lib/auth";
import type { CreateFeedingLogPayload, FeedingLog, UpdateFeedingLogPayload } from "@/types/feeding";
import type { Milestone } from "@/types/milestone";
import type { CreatePumpSessionPayload, PumpSession, UpdatePumpSessionPayload } from "@/types/pump";
import type { CreateSleepLogPayload, SleepLog, UpdateSleepLogPayload } from "@/types/sleep";
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
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Multipart upload — do NOT set Content-Type (browser/RN sets it with boundary)
async function apiFormFetch<T>(path: string, formData: FormData, method = "POST"): Promise<T> {
  const token = await getStoredToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // ── Feeding logs ────────────────────────────────────────────────
  getLogs: () => apiFetch<FeedingLog[]>("/api/feeding-logs"),
  getLog: (id: string) => apiFetch<FeedingLog>(`/api/feeding-logs/${id}`),
  createLog: (body: CreateFeedingLogPayload) =>
    apiFetch<FeedingLog>("/api/feeding-logs", { method: "POST", body: JSON.stringify(body) }),
  updateLog: (id: string, body: UpdateFeedingLogPayload) =>
    apiFetch<FeedingLog>(`/api/feeding-logs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteLog: (id: string) =>
    apiFetch<void>(`/api/feeding-logs/${id}`, { method: "DELETE" }),

  // ── Auth ────────────────────────────────────────────────────────
  login: (body: LoginPayload) =>
    apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: RegisterPayload) =>
    apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  googleSignIn: (idToken: string) =>
    apiFetch<AuthResponse>("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken }) }),

  // ── User profile ────────────────────────────────────────────────
  getProfile: () => apiFetch<UserProfile>("/api/users/GetMyProfile"),
  updateProfile: (body: UpdateProfilePayload) =>
    apiFetch<UserProfile>("/api/users/UpdateMyProfile", { method: "PATCH", body: JSON.stringify(body) }),

  // ── Pump sessions ───────────────────────────────────────────────
  getPumpSessions: () => apiFetch<PumpSession[]>("/api/pump-sessions"),
  createPumpSession: (body: CreatePumpSessionPayload) =>
    apiFetch<PumpSession>("/api/pump-sessions", { method: "POST", body: JSON.stringify(body) }),
  updatePumpSession: (id: string, body: UpdatePumpSessionPayload) =>
    apiFetch<PumpSession>(`/api/pump-sessions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePumpSession: (id: string) =>
    apiFetch<void>(`/api/pump-sessions/${id}`, { method: "DELETE" }),

  // ── Sleep logs ──────────────────────────────────────────────────
  getSleepLogs: () => apiFetch<SleepLog[]>("/api/sleep-logs"),
  createSleepLog: (body: CreateSleepLogPayload) =>
    apiFetch<SleepLog>("/api/sleep-logs", { method: "POST", body: JSON.stringify(body) }),
  updateSleepLog: (id: string, body: UpdateSleepLogPayload) =>
    apiFetch<SleepLog>(`/api/sleep-logs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSleepLog: (id: string) =>
    apiFetch<void>(`/api/sleep-logs/${id}`, { method: "DELETE" }),

  // ── Milestones ──────────────────────────────────────────────────
  getMilestones: () => apiFetch<Milestone[]>("/api/milestones"),
  createMilestone: (note: string, achievedAt: string, imageUri: string, mimeType: string) => {
    const formData = new FormData();
    formData.append("achievedAt", achievedAt);
    formData.append("note", note);
    formData.append("image", { uri: imageUri, type: mimeType, name: "milestone.jpg" } as any);
    return apiFormFetch<Milestone>("/api/milestones", formData);
  },
  deleteMilestone: (id: string) =>
    apiFetch<void>(`/api/milestones/${id}`, { method: "DELETE" }),
};
