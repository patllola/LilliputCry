"use client";

import { FormEvent, useState } from "react";
import { format } from "date-fns";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useBaby } from "@/lib/babyContext";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = ["#ff6fa5", "#8b6fe0", "#4aa8e0", "#2fae8a", "#e0a92e", "#f07a4a"];

interface AddBabyModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddBabyModal({ open, onClose, onAdded }: AddBabyModalProps) {
  const { addBaby } = useBaby();
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [dob, setDob] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Baby's name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await addBaby({
        name: name.trim(),
        avatarColor: color,
        dateOfBirth: new Date(dob).toISOString(),
        weightKg: weightKg ? Number(weightKg) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
      });
      setName("");
      setWeightKg("");
      setHeightCm("");
      onAdded?.();
      onClose();
    } catch {
      setError("Could not add baby. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">Add a Baby</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Baby's name"
            placeholder="e.g. Ava"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Avatar color</p>
            <div className="flex gap-2.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-9 h-9 rounded-xl transition-shadow",
                    color === c && "ring-2 ring-offset-2 ring-gray-400"
                  )}
                  style={{ background: c }}
                  aria-label={`Choose color ${c}`}
                />
              ))}
            </div>
          </div>

          <Input
            label="Date of birth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weight"
              type="number"
              step={0.1}
              min={0}
              placeholder="3.4"
              rightText="kg"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
            <Input
              label="Height"
              type="number"
              step={0.1}
              min={0}
              placeholder="50"
              rightText="cm"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" loading={loading} className="flex-1">
              Add Baby
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
