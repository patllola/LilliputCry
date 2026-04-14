"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { api } from "@/api";
import { FeedingLog } from "@/types/feeding";

type FormErrors = {
  fedAt?: string;
  milkPrepared?: string;
  milkFed?: string;
};

function toLocalDatetimeValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

interface FeedingFormProps {
  initialLog?: FeedingLog;
  hideCancel?: boolean;
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function FeedingForm({
  initialLog,
  hideCancel = false,
  redirectTo = "/",
  onSuccess,
}: FeedingFormProps) {
  const router = useRouter();
  const isEdit = !!initialLog;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [fedAt, setFedAt] = useState(
    initialLog ? toLocalDatetimeValue(new Date(initialLog.fedAt)) : toLocalDatetimeValue(new Date())
  );
  const [milkPrepared, setMilkPrepared] = useState(
    initialLog ? String(initialLog.milkPrepared) : ""
  );
  const [milkFed, setMilkFed] = useState(initialLog ? String(initialLog.milkFed) : "");
  const [notes, setNotes] = useState(initialLog?.notes ?? "");

  function isDirty(): boolean {
    if (!isEdit) return !!(fedAt || milkPrepared || milkFed || notes);
    return (
      fedAt !== toLocalDatetimeValue(new Date(initialLog!.fedAt)) ||
      milkPrepared !== String(initialLog!.milkPrepared) ||
      milkFed !== String(initialLog!.milkFed) ||
      notes !== (initialLog!.notes ?? "")
    );
  }

  function handleCancel() {
    if (isDirty() && !confirm("You have unsaved changes. Discard them?")) return;
    router.back();
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!fedAt) e.fedAt = "Feeding time is required";
    if (!milkPrepared || Number(milkPrepared) <= 0) e.milkPrepared = "Must be greater than 0";
    if (milkFed === "") e.milkFed = "Required (enter 0 if baby refused)";
    if (Number(milkFed) < 0) e.milkFed = "Cannot be negative";
    if (Number(milkFed) > Number(milkPrepared)) e.milkFed = "Cannot exceed milk prepared";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    try {
      if (isEdit) {
        await api.updateLog(initialLog!.id, {
          fedAt: new Date(fedAt).toISOString(),
          milkPrepared: Number(milkPrepared),
          milkFed: Number(milkFed),
          notes: notes.trim() || undefined,
        });
      } else {
        await api.createLog({
          fedAt: new Date(fedAt).toISOString(),
          milkPrepared: Number(milkPrepared),
          milkFed: Number(milkFed),
          notes: notes.trim() || undefined,
        });
      }
      if (onSuccess) {
        onSuccess();
        setFedAt(toLocalDatetimeValue(new Date()));
        setMilkPrepared("");
        setMilkFed("");
        setNotes("");
        setLoading(false);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const preparedNum = Number(milkPrepared);
  const fedNum = Number(milkFed);
  const wastePreview =
    milkPrepared && milkFed && preparedNum > 0 && fedNum >= 0 && fedNum <= preparedNum
      ? preparedNum - fedNum
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Feeding time"
        type="datetime-local"
        value={fedAt}
        onChange={(e) => setFedAt(e.target.value)}
        error={errors.fedAt}
        required
        max={toLocalDatetimeValue(new Date())}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Milk prepared"
          type="number"
          min={0}
          step={0.5}
          placeholder="e.g. 150"
          value={milkPrepared}
          onChange={(e) => setMilkPrepared(e.target.value)}
          error={errors.milkPrepared}
          rightText="ml"
          required
          hint="Total amount you prepared"
        />
        <Input
          label="Milk fed to baby"
          type="number"
          min={0}
          step={0.5}
          placeholder="e.g. 120"
          value={milkFed}
          onChange={(e) => setMilkFed(e.target.value)}
          error={errors.milkFed}
          rightText="ml"
          required
          hint="Amount baby actually drank"
        />
      </div>

      {/* Live waste preview */}
      {wastePreview !== null && (
        <div
          className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
            wastePreview === 0 ? "bg-emerald-50" : "bg-peach-50"
          }`}
        >
          <svg
            className={`w-5 h-5 flex-shrink-0 ${wastePreview === 0 ? "text-emerald-500" : "text-peach-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {wastePreview === 0 ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
          <span
            className={`text-sm font-medium ${wastePreview === 0 ? "text-emerald-700" : "text-peach-500"}`}
          >
            {wastePreview === 0
              ? "Baby finished all the milk!"
              : `Waste: ${wastePreview % 1 === 0 ? wastePreview : wastePreview.toFixed(1)} ml (${
                  preparedNum > 0 ? Math.round((wastePreview / preparedNum) * 100) : 0
                }%)`}
          </span>
        </div>
      )}

      <Textarea
        label="Notes (optional)"
        placeholder="e.g. Baby was sleepy, needed burping twice..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        hint="Any observations about this feeding session"
      />

      {apiError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {apiError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" size="lg" loading={loading} className="flex-1">
          {isEdit ? "Save Changes" : "Save Feeding Log"}
        </Button>
        {!hideCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
