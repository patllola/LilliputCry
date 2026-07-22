function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months--;
  return Math.max(0, months);
}

export function formatBabyAge(dateOfBirth: string): string {
  const months = monthsBetween(new Date(dateOfBirth), new Date());
  if (months < 1) return "Newborn";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years < 1) return `${months} month${months === 1 ? "" : "s"} old`;
  return remMonths === 0 ? `${years} yr` : `${years} yr ${remMonths} mo`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function isMonthiversary(dateOfBirth: string): boolean {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const months = monthsBetween(birth, now);
  return months >= 1 && birth.getDate() === now.getDate();
}

export function monthiversaryLabel(dateOfBirth: string): string {
  const months = monthsBetween(new Date(dateOfBirth), new Date());
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years < 1) return `${months}-month day!`;
  return remMonths === 0 ? `${years}-year day!` : `${months}-month day!`;
}
