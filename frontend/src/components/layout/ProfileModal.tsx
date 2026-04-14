"use client";

import { useState, useEffect, FormEvent } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/api";
import { getStoredUser, storeUser } from "@/lib/auth";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const user = getStoredUser();
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber ?? "");
      setCountry(user.country ?? "");
      setCity(user.city ?? "");
      setGender(user.gender ?? "");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = getStoredUser();
      const updated = await api.updateProfile(user?.guidId ?? "", {
        fullName,
        email,
        phoneNumber: phoneNumber.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        gender: gender.trim() || undefined,
      });
      storeUser(updated);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email_already_exists")) {
        setError("This email is already in use.");
      } else {
        setError("Failed to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            placeholder="e.g. Sarah Johnson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Phone number"
            type="tel"
            placeholder="e.g. +1 555 000 0000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Country"
                placeholder="e.g. USA"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
              <Input
                label="City"
                placeholder="e.g. New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Input
              label="Gender"
              placeholder="e.g. Female"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" loading={loading} className="flex-1">
              {saved ? "Saved!" : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
