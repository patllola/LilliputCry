"use client";

import { useState } from "react";
import { useBaby } from "@/lib/babyContext";
import { formatBabyAge, cn } from "@/lib/utils";
import AddBabyModal from "./AddBabyModal";

interface BabySwitcherModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BabySwitcherModal({ open, onClose }: BabySwitcherModalProps) {
  const { babies, activeBaby, selectBaby } = useBaby();
  const [adding, setAdding] = useState(false);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="w-full max-w-md bg-white rounded-t-[28px] p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">Your babies</h2>

          <div className="flex flex-col gap-2.5">
            {babies.map((b) => {
              const active = b.id === activeBaby?.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    selectBaby(b.id);
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-2xl px-3.5 py-3 border transition-colors",
                    active ? "bg-brand-50 border-brand-400" : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white shrink-0"
                    style={{ background: b.avatarColor }}
                  >
                    {b.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-extrabold text-gray-900">{b.name}</div>
                    <div className="text-xs font-semibold text-gray-400">
                      {formatBabyAge(b.dateOfBirth)}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-[26px] h-[26px] rounded-full flex items-center justify-center",
                      active ? "bg-brand-500" : "border border-gray-200"
                    )}
                  >
                    {active && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full border-2 border-dashed border-brand-300 text-brand-600 rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add another baby
          </button>
        </div>
      </div>

      <AddBabyModal open={adding} onClose={() => setAdding(false)} onAdded={onClose} />
    </>
  );
}
