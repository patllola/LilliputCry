"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import { api } from "@/api";
import { useBaby } from "@/lib/babyContext";
import { formatMl } from "@/lib/utils";

function clamp(v: number) {
  return Math.max(0, Math.min(300, v));
}

function Ring({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  const pct = (clamp(value) / 150) * 360;
  return (
    <div className="flex-1 text-center">
      <div className="text-xs font-bold text-gray-400 mb-2">{label}</div>
      <div
        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
        style={{ background: `conic-gradient(#4aa8e0 ${Math.min(pct, 360)}deg, #d9f0ff 0deg)` }}
      >
        <div className="w-[72px] h-[72px] rounded-full bg-white flex flex-col items-center justify-center">
          <div className="text-xl font-extrabold text-gray-900">{value}</div>
          <div className="text-[10px] font-semibold text-gray-400">ml</div>
        </div>
      </div>
      <div className="flex gap-2 justify-center mt-3">
        <button
          type="button"
          onClick={onMinus}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-200 font-bold text-gray-700 hover:border-brand-300"
        >
          −
        </button>
        <button
          type="button"
          onClick={onPlus}
          className="w-10 h-10 rounded-2xl bg-brand-500 text-white font-bold hover:bg-brand-600"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface PumpFormProps {
  onSuccess: () => void;
}

export default function PumpForm({ onSuccess }: PumpFormProps) {
  const { activeBaby } = useBaby();
  const [left, setLeft] = useState(70);
  const [right, setRight] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createPumpSession({
        pumpedAt: new Date().toISOString(),
        leftAmount: left,
        rightAmount: right,
        babyId: activeBaby?.id,
      });
      onSuccess();
    } catch {
      setError("Could not save pump session. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-4">
        <Ring label="LEFT" value={left} onMinus={() => setLeft((v) => clamp(v - 5))} onPlus={() => setLeft((v) => clamp(v + 5))} />
        <Ring label="RIGHT" value={right} onMinus={() => setRight((v) => clamp(v - 5))} onPlus={() => setRight((v) => clamp(v + 5))} />
      </div>

      <div className="flex items-center justify-between bg-[#d9f0ff] rounded-2xl px-4 py-3.5">
        <span className="text-sm font-extrabold text-[#3a7ba0]">Total pumped</span>
        <span className="text-lg font-extrabold text-[#4aa8e0]">{formatMl(left + right)}</span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Save Session
      </Button>
    </form>
  );
}
