// Mock subscription store — shaped like a future subscription API client.
// Replace the bodies of these functions with real `api.*` calls once the
// backend has a subscription endpoint; callers won't need to change.

export type PlanId = "free" | "plus" | "family";
export type Billing = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  badge?: string;
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "The basics, one baby",
    monthly: 0,
    yearly: 0,
    features: ["Feeding & sleep logs", "1 baby profile", "7 days of history"],
  },
  {
    id: "plus",
    name: "Plus",
    badge: "Popular",
    tagline: "For growing families",
    monthly: 4.99,
    yearly: 47.9,
    features: ["Everything in Free", "Up to 3 babies", "Medication reminders", "Unlimited history"],
  },
  {
    id: "family",
    name: "Family",
    badge: "Best value",
    tagline: "Share with caregivers",
    monthly: 8.99,
    yearly: 86.3,
    features: ["Everything in Plus", "Unlimited babies", "Invite 4 caregivers", "Export & printable reports"],
  },
];

let currentPlanId: PlanId = "free";
let currentBilling: Billing = "monthly";

export function getCurrentPlan(): { planId: PlanId; billing: Billing } {
  return { planId: currentPlanId, billing: currentBilling };
}

export function setCurrentPlan(planId: PlanId, billing: Billing): void {
  currentPlanId = planId;
  currentBilling = billing;
}

export function planSubtitle(): string {
  if (currentPlanId === "free") return "Free · upgrade";
  const plan = PLANS.find((p) => p.id === currentPlanId)!;
  return `${plan.name} · ${currentBilling === "monthly" ? "monthly" : "yearly"}`;
}
