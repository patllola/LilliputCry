"use client";

import { FormEvent, useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Stepper from "@/components/ui/Stepper";
import ChipGroup from "@/components/ui/ChipGroup";
import { api } from "@/api";
import { useBaby } from "@/lib/babyContext";
import { cn } from "@/lib/utils";

const QUICK_MINS = [30, 60, 90, 120, 180];

function fmtDur(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

interface SleepFormProps {
  onSuccess: () => void;
}

export default function SleepForm({ onSuccess }: SleepFormProps) {
  const { activeBaby } = useBaby();
  const [isNap, setIsNap] = useState(false);
  const [mins, setMins] = useState(90);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clampMins(v: number) {
    return Math.max(15, Math.min(1440, v));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sleepEnd = new Date();
      const sleepStart = new Date(sleepEnd.getTime() - mins * 60_000);
      await api.createSleepLog({
        sleepStart: sleepStart.toISOString(),
        sleepEnd: sleepEnd.toISOString(),
        isNap,
        notes: notes.trim() || undefined,
        babyId: activeBaby?.id,
      });
      setNotes("");
      onSuccess();
    } catch {
      setError("Could not save sleep log. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tab = (active: boolean) =>
    cn(
      "flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-colors",
      active ? "bg-brand-500 text-white" : "text-gray-500"
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex bg-brand-50 rounded-2xl p-1">
        <button type="button" onClick={() => setIsNap(false)} className={tab(!isNap)}>
          🌙 Night
        </button>
        <button type="button" onClick={() => setIsNap(true)} className={tab(isNap)}>
          🛏 Nap
        </button>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 text-center mb-2">Duration</p>
        <Stepper
          value={fmtDur(mins)}
          onDecrement={() => setMins((m) => clampMins(m - 15))}
          onIncrement={() => setMins((m) => clampMins(m + 15))}
        />
      </div>

      <ChipGroup
        options={QUICK_MINS.map((v) => ({ label: fmtDur(v), value: String(v) }))}
        value={String(mins)}
        onChange={(v) => setMins(Number(v))}
      />

      <Textarea
        label="Notes (optional)"
        placeholder="e.g. slept through, woke once…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Log Sleep
      </Button>
    </form>
  );
}
