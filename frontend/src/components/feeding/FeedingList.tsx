"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedingLog } from "@/types/feeding";
import { api } from "@/api";
import FeedingCard from "./FeedingCard";
import EmptyState from "@/components/layout/EmptyState";
import { formatDate } from "@/lib/utils";

interface FeedingListProps {
  logs: FeedingLog[];
}

function groupByDate(logs: FeedingLog[]): Record<string, FeedingLog[]> {
  return logs.reduce<Record<string, FeedingLog[]>>((acc, log) => {
    const key = formatDate(log.fedAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
}

export default function FeedingList({ logs: initialLogs }: FeedingListProps) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);

  async function handleDelete(id: string) {
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteLog(id);
      router.refresh();
    } catch {
      setLogs(snapshot);
      alert("Failed to delete. Please try again.");
    }
  }

  if (logs.length === 0) return <EmptyState />;

  const grouped = groupByDate(logs);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateLogs]) => (
        <section key={date}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-500">{date}</h3>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">
              {dateLogs.length} feeding{dateLogs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {dateLogs.map((log) => (
              <FeedingCard key={log.id} log={log} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
