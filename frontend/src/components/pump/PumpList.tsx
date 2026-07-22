"use client";

import { useState } from "react";
import { PumpSession } from "@/types/pump";
import { api } from "@/api";
import EmptyState from "@/components/layout/EmptyState";
import Button from "@/components/ui/Button";
import { formatDate, formatMl, formatTime } from "@/lib/utils";

interface PumpListProps {
  sessions: PumpSession[];
}

export default function PumpList({ sessions: initialSessions }: PumpListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this pump session?")) return;
    const snapshot = sessions;
    setDeletingId(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.deletePumpSession(id);
    } catch {
      setSessions(snapshot);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (sessions.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
        >
          <div>
            <div className="text-base font-bold text-gray-800">{formatMl(s.totalAmount)}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              L {formatMl(s.leftAmount)} · R {formatMl(s.rightAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {formatDate(s.pumpedAt)} · {formatTime(s.pumpedAt)}
            </div>
            {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={deletingId === s.id}
            onClick={() => handleDelete(s.id)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Delete session"
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
