export interface AdminStats {
  totalUsers: number;
  activeTrialUsers: number;
  expiredTrialUsers: number;
  activePaidUsers: number;
  expiredPaidUsers: number;
  adminUsers: number;
  estimatedMonthlyRevenue: number;
}

export interface AdminUser {
  id: number;
  guidId: string;
  fullName: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  hasActiveAccess: boolean;
  createdAt: string;
}
