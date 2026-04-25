"use client";

import { FeedingLog } from "@/types/feeding";
import { buildCurrentWeek } from "./chartUtils";
import DailyMilkIntakeChart from "./DailyMilkIntakeChart";
import WasteTrendChart from "./WasteTrendChart";
import FeedingsPerDayChart from "./FeedingsPerDayChart";

interface Props {
  logs: FeedingLog[];
}

export default function FeedingCharts({ logs }: Props) {
  const data = buildCurrentWeek(logs);

  return (
    <div className="space-y-6">
      <DailyMilkIntakeChart data={data} />
      <WasteTrendChart data={data} />
      <FeedingsPerDayChart data={data} />
    </div>
  );
}
