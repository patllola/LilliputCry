import type { CreateFeedingLogPayload, FeedingLog, UpdateFeedingLogPayload } from "@/types/feeding";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from "@/types/user";
import type { Baby, CreateBabyPayload, UpdateBabyPayload } from "@/types/baby";
import type {
  CreateMedicationPayload,
  Medication,
  UpdateMedicationPayload,
} from "@/types/medication";
import type {
  CreateMilestonePayload,
  Milestone,
  UpdateMilestonePayload,
} from "@/types/milestone";
import type {
  CreatePumpSessionPayload,
  PumpSession,
  UpdatePumpSessionPayload,
} from "@/types/pump";
import type { CreateSleepLogPayload, SleepLog, UpdateSleepLogPayload } from "@/types/sleep";
import { getStoredToken } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
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

async function apiFetchForm<T>(path: string, init: RequestInit): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
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

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

function milestoneFormData(body: CreateMilestonePayload | UpdateMilestonePayload): FormData {
  const form = new FormData();
  if (body.achievedAt) form.append("achievedAt", body.achievedAt);
  if (body.note !== undefined) form.append("note", body.note);
  if (body.image) form.append("image", body.image);
  if (body.babyId) form.append("babyId", body.babyId);
  return form;
}

export const api = {
  // Feeding logs
  getLogs: (babyId?: string) => apiFetch<FeedingLog[]>(`/api/feeding-logs${query({ babyId })}`),

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

  // User profile (identity comes from JWT — no guidId needed)
  getProfile: () => apiFetch<UserProfile>("/api/users/GetMyProfile"),

  updateProfile: (body: UpdateProfilePayload) =>
    apiFetch<UserProfile>("/api/users/UpdateMyProfile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Babies
  getBabies: () => apiFetch<Baby[]>("/api/babies"),

  getBaby: (id: string) => apiFetch<Baby>(`/api/babies/${id}`),

  createBaby: (body: CreateBabyPayload) =>
    apiFetch<Baby>("/api/babies", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateBaby: (id: string, body: UpdateBabyPayload) =>
    apiFetch<Baby>(`/api/babies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteBaby: (id: string) => apiFetch<void>(`/api/babies/${id}`, { method: "DELETE" }),

  // Medications
  getMedications: (babyId?: string) =>
    apiFetch<Medication[]>(`/api/medications${query({ babyId })}`),

  getMedication: (id: string) => apiFetch<Medication>(`/api/medications/${id}`),

  createMedication: (body: CreateMedicationPayload) =>
    apiFetch<Medication>("/api/medications", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateMedication: (id: string, body: UpdateMedicationPayload) =>
    apiFetch<Medication>(`/api/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  toggleMedicationDone: (id: string) =>
    apiFetch<Medication>(`/api/medications/${id}/toggle-done`, { method: "PATCH" }),

  toggleMedicationReminder: (id: string) =>
    apiFetch<Medication>(`/api/medications/${id}/toggle-reminder`, { method: "PATCH" }),

  deleteMedication: (id: string) => apiFetch<void>(`/api/medications/${id}`, { method: "DELETE" }),

  // Milestones (multipart — image upload)
  getMilestones: (babyId?: string) =>
    apiFetch<Milestone[]>(`/api/milestones${query({ babyId })}`),

  getMilestone: (id: string) => apiFetch<Milestone>(`/api/milestones/${id}`),

  createMilestone: (body: CreateMilestonePayload) =>
    apiFetchForm<Milestone>("/api/milestones", {
      method: "POST",
      body: milestoneFormData(body),
    }),

  updateMilestone: (id: string, body: UpdateMilestonePayload) =>
    apiFetchForm<Milestone>(`/api/milestones/${id}`, {
      method: "PUT",
      body: milestoneFormData(body),
    }),

  deleteMilestone: (id: string) => apiFetch<void>(`/api/milestones/${id}`, { method: "DELETE" }),

  // Pump sessions
  getPumpSessions: (babyId?: string) =>
    apiFetch<PumpSession[]>(`/api/pump-sessions${query({ babyId })}`),

  getPumpSession: (id: string) => apiFetch<PumpSession>(`/api/pump-sessions/${id}`),

  createPumpSession: (body: CreatePumpSessionPayload) =>
    apiFetch<PumpSession>("/api/pump-sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updatePumpSession: (id: string, body: UpdatePumpSessionPayload) =>
    apiFetch<PumpSession>(`/api/pump-sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deletePumpSession: (id: string) =>
    apiFetch<void>(`/api/pump-sessions/${id}`, { method: "DELETE" }),

  // Sleep logs
  getSleepLogs: (babyId?: string) => apiFetch<SleepLog[]>(`/api/sleep-logs${query({ babyId })}`),

  getSleepLog: (id: string) => apiFetch<SleepLog>(`/api/sleep-logs/${id}`),

  createSleepLog: (body: CreateSleepLogPayload) =>
    apiFetch<SleepLog>("/api/sleep-logs", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateSleepLog: (id: string, body: UpdateSleepLogPayload) =>
    apiFetch<SleepLog>(`/api/sleep-logs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteSleepLog: (id: string) => apiFetch<void>(`/api/sleep-logs/${id}`, { method: "DELETE" }),
};
