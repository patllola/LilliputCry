"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isToday } from "date-fns";
import { useBaby } from "@/lib/babyContext";
import { api } from "@/api";
import {
  formatBabyAge,
  formatMl,
  formatShortDate,
  isMonthiversary,
  monthiversaryLabel,
} from "@/lib/utils";
import BabySwitcherModal from "./BabySwitcherModal";
import AddBabyModal from "./AddBabyModal";

interface TodayStats {
  feedingsToday: number;
  sleepMinutesToday: number;
  pumpMlToday: number;
  medsDue: number;
  milestoneCount: number;
}

const EMPTY_STATS: TodayStats = {
  feedingsToday: 0,
  sleepMinutesToday: 0,
  pumpMlToday: 0,
  medsDue: 0,
  milestoneCount: 0,
};

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const FLOWERS = ["🌸", "🌼", "🌷", "💮", "🏵️"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${Math.round((i / 14) * 100 + Math.random() * 4)}%`,
        emoji: FLOWERS[i % FLOWERS.length],
        size: 16 + Math.round(Math.random() * 10),
        duration: 3 + Math.random() * 1.4,
        delay: Math.random() * 1.2,
      })),
    []
  );
  return (
    <div className="confetti-wrap">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-flower"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

export default function FeatureHub() {
  const { babies, activeBaby, loading } = useBaby();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [stats, setStats] = useState<TodayStats>(EMPTY_STATS);
  const [celebrating, setCelebrating] = useState(false);

  const monthiversary = activeBaby ? isMonthiversary(activeBaby.dateOfBirth) : false;

  useEffect(() => {
    if (monthiversary) setCelebrating(true);
  }, [monthiversary, activeBaby?.id]);

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 4500);
    return () => clearTimeout(timer);
  }, [celebrating]);

  useEffect(() => {
    if (!activeBaby) {
      setStats(EMPTY_STATS);
      return;
    }
    let cancelled = false;
    Promise.allSettled([
      api.getLogs(activeBaby.id),
      api.getSleepLogs(activeBaby.id),
      api.getPumpSessions(activeBaby.id),
      api.getMedications(activeBaby.id),
      api.getMilestones(activeBaby.id),
    ]).then(([feedings, sleep, pump, meds, milestones]) => {
      if (cancelled) return;
      setStats({
        feedingsToday:
          feedings.status === "fulfilled"
            ? feedings.value.filter((l) => isToday(new Date(l.fedAt))).length
            : 0,
        sleepMinutesToday:
          sleep.status === "fulfilled"
            ? sleep.value
                .filter((l) => isToday(new Date(l.sleepEnd)))
                .reduce((sum, l) => sum + l.durationMinutes, 0)
            : 0,
        pumpMlToday:
          pump.status === "fulfilled"
            ? pump.value
                .filter((p) => isToday(new Date(p.pumpedAt)))
                .reduce((sum, p) => sum + p.totalAmount, 0)
            : 0,
        medsDue: meds.status === "fulfilled" ? meds.value.filter((m) => !m.isDoneToday).length : 0,
        milestoneCount: milestones.status === "fulfilled" ? milestones.value.length : 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeBaby]);

  const tiles = [
    {
      href: "/log",
      bg: "#ffe1ec",
      iconColor: "#ff6fa5",
      label: "Feeding",
      subtitle: `${stats.feedingsToday} logged today`,
      icon: (
        <path d="M9 2h6M10.5 2v3l-2 2v13a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V7l-2-2V2M8.5 11h7" />
      ),
    },
    {
      href: "/sleep",
      bg: "#e7ddff",
      iconColor: "#8b6fe0",
      label: "Sleep",
      subtitle: `${fmtDuration(stats.sleepMinutesToday)} today`,
      icon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    },
    {
      href: "/pump",
      bg: "#d9f0ff",
      iconColor: "#4aa8e0",
      label: "Milk Pump",
      subtitle: `${formatMl(stats.pumpMlToday)} pumped`,
      icon: <path d="M12 3s6 5.7 6 10a6 6 0 0 1-12 0c0-4.3 6-10 6-10z" />,
    },
    {
      href: "/medications",
      bg: "#d7f5e8",
      iconColor: "#2fae8a",
      label: "Medication",
      subtitle: `${stats.medsDue} due today`,
      icon: (
        <>
          <path d="M10.5 20.5 4 14a5 5 0 0 1 7-7l6.5 6.5a5 5 0 0 1-7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </>
      ),
    },
    {
      href: "/milestones",
      bg: "#fff2cf",
      iconColor: "#e0a92e",
      label: "Milestones",
      subtitle: `${stats.milestoneCount} memories`,
      icon: (
        <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
      ),
    },
    {
      href: "/refer",
      bg: "#ffe0d3",
      iconColor: "#f07a4a",
      label: "Refer",
      subtitle: "Earn rewards",
      icon: (
        <>
          <rect x="3" y="8" width="18" height="13" rx="1.5" />
          <path d="M3 12h18M12 8v13M12 8S9.5 3.5 7 5.5 12 8 12 8zM12 8s2.5-4.5 5-2.5S12 8 12 8z" />
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-3xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (babies.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-3xl">
          👶
        </div>
        <h1 className="text-xl font-bold text-gray-900">Add your baby to get started</h1>
        <p className="text-sm text-gray-500">
          Create a profile to start tracking feedings, sleep, and more.
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-2xl px-6 py-3 shadow-md hover:shadow-lg transition-shadow"
        >
          Add a Baby
        </button>
        <AddBabyModal open={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {celebrating && <Confetti />}

      {/* Hero */}
      {activeBaby && (
        <div className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 text-white bg-gradient-to-br from-[#ff85b3] to-[#b7a4ff]">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/15" />
          <div className="relative flex items-center justify-between">
            <button
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-3 text-left"
            >
              <div className="w-[52px] h-[52px] rounded-2xl bg-white/25 flex items-center justify-center text-xl font-extrabold">
                {activeBaby.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xl font-extrabold leading-tight">
                  {activeBaby.name}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                <div className="text-xs font-semibold opacity-90">
                  {formatBabyAge(activeBaby.dateOfBirth)}
                </div>
              </div>
            </button>
            {monthiversary && (
              <button
                onClick={() => setCelebrating(true)}
                className="bg-white/25 rounded-2xl px-3 py-2 text-[11.5px] font-extrabold text-center leading-tight"
              >
                🌸
                <br />
                {monthiversaryLabel(activeBaby.dateOfBirth)}
              </button>
            )}
          </div>
          <div className="relative flex gap-2.5 mt-4">
            <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <div className="text-[10.5px] font-semibold opacity-85">Born</div>
              <div className="text-[13.5px] font-extrabold mt-0.5">
                {formatShortDate(activeBaby.dateOfBirth)}
              </div>
            </div>
            <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <div className="text-[10.5px] font-semibold opacity-85">Weight</div>
              <div className="text-[13.5px] font-extrabold mt-0.5">
                {activeBaby.weightKg != null ? `${activeBaby.weightKg} kg` : "—"}
              </div>
            </div>
            <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5">
              <div className="text-[10.5px] font-semibold opacity-85">Height</div>
              <div className="text-[13.5px] font-extrabold mt-0.5">
                {activeBaby.heightCm != null ? `${activeBaby.heightCm} cm` : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature grid */}
      <div>
        <h2 className="text-sm font-extrabold text-gray-800 mb-3">Track &amp; explore</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="text-left rounded-3xl p-4 flex flex-col gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ background: t.bg }}
            >
              <div className="w-[42px] h-[42px] rounded-2xl bg-white flex items-center justify-center" style={{ color: t.iconColor }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {t.icon}
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-gray-800">{t.label}</div>
                <div className="text-[11.5px] font-semibold text-gray-800/50">{t.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BabySwitcherModal open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </div>
  );
}
