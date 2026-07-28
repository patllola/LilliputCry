export type PlanTierId = "free" | "plus" | "family";

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  plusUsers: number;
  familyUsers: number;
  /** Chose a paid tier but it has run out — the upgrade-recovery pool. */
  lapsedUsers: number;
  adminUsers: number;
  estimatedMonthlyRevenue: number;
}

export interface AdminUser {
  id: number;
  guidId: string;
  fullName: string;
  email: string;
  role: string;
  /** What they picked. */
  planTier: PlanTierId;
  /** What's actually enforced — differs from planTier once a paid plan lapses. */
  effectivePlanTier: PlanTierId;
  billingCycle: "monthly" | "yearly";
  planSelectedAt: string | null;
  planExpiresAt: string | null;
  hasPaidAccess: boolean;
  createdAt: string;
}
