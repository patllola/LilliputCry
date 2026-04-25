import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { FeedingLog } from "@/types/feeding";

export interface ChartDayData {
  day: string;
  "Milk Fed (ml)": number;
  "Milk Prepared (ml)": number;
  "Waste %": number;
  feedings: number;
}

export function buildCurrentWeek(logs: FeedingLog[]): ChartDayData[] {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const dayLogs = logs.filter((l) => isSameDay(new Date(l.fedAt), day));

    const totalFed = dayLogs.reduce((s, l) => s + l.milkFed, 0);
    const totalPrepared = dayLogs.reduce((s, l) => s + l.milkPrepared, 0);
    const wastePercent =
      totalPrepared > 0 ? Math.round(((totalPrepared - totalFed) / totalPrepared) * 100) : 0;

    return {
      day: format(day, "EEE"),
      "Milk Fed (ml)": totalFed,
      "Milk Prepared (ml)": totalPrepared,
      "Waste %": wastePercent,
      feedings: dayLogs.length,
    };
  });
}
