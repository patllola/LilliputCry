// Mock caregiver store — shaped like a future `caregiver_invites` API client.
// Replace the bodies of these functions with real `api.*` calls once the
// backend has caregiver/invite endpoints; callers won't need to change.

export type Role = "owner" | "full" | "log" | "read";

export type Caregiver = {
  id: string;
  name: string;
  email: string;
  role: Role;
  color: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  invitedLabel: string;
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  full: "Full access",
  log: "Log only",
  read: "Read only",
};

let caregivers: Caregiver[] = [
  { id: "c1", name: "Maya Chen (you)", email: "maya@example.com", role: "owner", color: "#ff6fa5" },
  { id: "c2", name: "Daniel Chen", email: "daniel@example.com", role: "full", color: "#4aa8e0" },
  { id: "c3", name: "Grandma Rose", email: "rose@example.com", role: "log", color: "#e0a92e" },
];

let pendingInvites: PendingInvite[] = [];
let nextId = 1;

export function listCaregivers(): Caregiver[] {
  return caregivers;
}

export function listPendingInvites(): PendingInvite[] {
  return pendingInvites;
}

export function sendInvite(email: string, role: Role): PendingInvite {
  const invite: PendingInvite = { id: `inv${nextId++}`, email, role, invitedLabel: "just now" };
  pendingInvites = [invite, ...pendingInvites];
  return invite;
}

export function cancelInvite(id: string): void {
  pendingInvites = pendingInvites.filter((i) => i.id !== id);
}
