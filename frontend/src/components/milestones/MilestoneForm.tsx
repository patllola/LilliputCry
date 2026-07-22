"use client";

import { FormEvent, useRef, useState } from "react";
import { format } from "date-fns";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ChipGroup from "@/components/ui/ChipGroup";
import { api } from "@/api";
import { useBaby } from "@/lib/babyContext";

const QUICK_NOTES = ["First smile", "First laugh", "Rolled over", "First steps", "First tooth"];

interface MilestoneFormProps {
  onSuccess: () => void;
}

export default function MilestoneForm({ onSuccess }: MilestoneFormProps) {
  const { activeBaby } = useBaby();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [note, setNote] = useState("First smile");
  const [achievedAt, setAchievedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!image) {
      setError("Please add a photo");
      return;
    }
    if (!note.trim()) {
      setError("Please describe what happened");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createMilestone({
        achievedAt: new Date(achievedAt).toISOString(),
        note: note.trim(),
        image,
        babyId: activeBaby?.id,
      });
      setImage(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      onSuccess();
    } catch {
      setError("Could not save milestone. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full h-36 rounded-2xl overflow-hidden bg-brand-50 border border-dashed border-brand-200 flex items-center justify-center text-sm font-semibold text-brand-500"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Milestone preview" className="w-full h-full object-cover" />
        ) : (
          "📷  Tap to add a photo"
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <Input
        label="What happened?"
        placeholder="e.g. First smile"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        required
      />

      <ChipGroup
        options={QUICK_NOTES.map((v) => ({ label: v, value: v }))}
        value={note}
        onChange={setNote}
      />

      <Input
        label="Date"
        type="date"
        value={achievedAt}
        onChange={(e) => setAchievedAt(e.target.value)}
        max={format(new Date(), "yyyy-MM-dd")}
        required
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Save Milestone 🎉
      </Button>
    </form>
  );
}
