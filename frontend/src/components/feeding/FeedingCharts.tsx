"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { FeedingLog } from "@/types/feeding";

interface Props {
  logs: FeedingLog[];
}

function buildCurrentWeek(logs: FeedingLog[]) {
  // Always start from Monday of the current week
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i); // Mon, Tue, Wed, Thu, Fri, Sat, Sun
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

export default function FeedingCharts({ logs }: Props) {
  const data = buildCurrentWeek(logs);

  return (
    <div className="space-y-6">
      {/* Daily Milk Intake */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Milk Intake — This Week</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              unit=" ml"
              width={55}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
              cursor={{ fill: "#f9fafb" }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="Milk Prepared (ml)" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Milk Fed (ml)" fill="#6d28d9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Waste % Trend */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Waste % Trend — This Week</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              unit="%"
              domain={[0, 100]}
              width={40}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
              formatter={(v) => [`${v}%`, "Waste"]}
            />
            <Line
              type="monotone"
              dataKey="Waste %"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Feedings per Day */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Feedings per Day — This Week</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
              formatter={(v) => [`${v}%`, "Waste"]}
            />
            <Bar dataKey="feedings" fill="#34d399" radius={[4, 4, 0, 0]} name="Feedings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
