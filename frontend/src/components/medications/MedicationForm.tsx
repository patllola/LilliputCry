"use client";

import { FormEvent, useState } from "react";
import { format, parse } from "date-fns";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import { api } from "@/api";
import { useBaby } from "@/lib/babyContext";

interface MedicationFormProps {
  onSuccess: () => void;
}

export default function MedicationForm({ onSuccess }: MedicationFormProps) {
  const { activeBaby } = useBaby();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Medicine name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const timeOfDay = format(parse(time, "HH:mm", new Date()), "h:mm a");
      await api.createMedication({
        name: name.trim(),
        dose: dose.trim() || undefined,
        timeOfDay,
        repeatDaily,
        reminderEnabled,
        babyId: activeBaby?.id,
      });
      setName("");
      setDose("");
      onSuccess();
    } catch {
      setError("Could not add medication. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Medicine name"
        placeholder="e.g. Vitamin D drops"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Dose"
          placeholder="400 IU"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
        />
        <Input
          label="Time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      <Toggle checked={repeatDaily} onChange={setRepeatDaily} label="Repeat daily" />
      <Toggle checked={reminderEnabled} onChange={setReminderEnabled} label="Remind me 🔔" />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Add Medication
      </Button>
    </form>
  );
}
