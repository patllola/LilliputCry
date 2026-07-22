"use client";

import { useState } from "react";
import { SleepLog } from "@/types/sleep";
import { api } from "@/api";
import EmptyState from "@/components/layout/EmptyState";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";

function fmtDur(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface SleepListProps {
  logs: SleepLog[];
}

export default function SleepList({ logs: initialLogs }: SleepListProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this sleep log?")) return;
    const snapshot = logs;
    setDeletingId(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteSleepLog(id);
    } catch {
      setLogs(snapshot);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (logs.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center text-lg">
              {log.isNap ? "🛏" : "🌙"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-800">{fmtDur(log.durationMinutes)}</span>
                <Badge variant={log.isNap ? "orange" : "purple"}>{log.isNap ? "Nap" : "Night"}</Badge>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {formatDate(log.sleepEnd)} · ended {formatTime(log.sleepEnd)}
              </div>
              {log.notes && <p className="text-xs text-gray-500 mt-1">{log.notes}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={deletingId === log.id}
            onClick={() => handleDelete(log.id)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Delete log"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      ))}
    </div>
  );
}
