export interface UserProfile {
  id: number;
  guidId: string;
  fullName: string;
  email: string;
  profilePictureUrl: string | null;
  phoneNumber: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  role: string;
  planTier: "free" | "plus" | "family";
  billingCycle: "monthly" | "yearly";
  /** When paid access lapses. Null on Free, or on a paid tier not yet paid for. */
  planExpiresAt: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  token: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  gender?: string;
  address?: string;
}
