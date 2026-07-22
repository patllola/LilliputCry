"use client";

import { useState } from "react";
import { Milestone } from "@/types/milestone";
import { api } from "@/api";
import EmptyState from "@/components/layout/EmptyState";
import Button from "@/components/ui/Button";
import { formatShortDate } from "@/lib/utils";

interface MilestoneListProps {
  milestones: Milestone[];
}

export default function MilestoneList({ milestones: initial }: MilestoneListProps) {
  const [milestones, setMilestones] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;
    const snapshot = milestones;
    setDeletingId(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMilestone(id);
    } catch {
      setMilestones(snapshot);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (milestones.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {milestones.map((m) => (
        <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.imageUrl} alt={m.note} className="w-full h-32 object-cover" />
          <div className="p-3">
            <div className="text-sm font-bold text-gray-800 line-clamp-2">{m.note}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{formatShortDate(m.achievedAt)}</span>
              <Button
                variant="ghost"
                size="sm"
                loading={deletingId === m.id}
                onClick={() => handleDelete(m.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 !px-1.5"
                title="Delete milestone"
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
          </div>
        </div>
      ))}
    </div>
  );
}
