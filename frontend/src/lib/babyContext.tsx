"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/api";
import { getStoredToken } from "@/lib/auth";
import type { Baby, CreateBabyPayload } from "@/types/baby";

const ACTIVE_BABY_KEY = "lilliputcry_active_baby";

interface BabyContextValue {
  babies: Baby[];
  activeBaby: Baby | null;
  loading: boolean;
  selectBaby: (id: string) => void;
  addBaby: (payload: CreateBabyPayload) => Promise<Baby>;
  refresh: () => Promise<void>;
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getStoredToken()) {
      setBabies([]);
      setLoading(false);
      return;
    }
    try {
      const list = await api.getBabies();
      setBabies(list);
      setActiveBabyId((current) => {
        if (current && list.some((b) => b.id === current)) return current;
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(ACTIVE_BABY_KEY) : null;
        if (stored && list.some((b) => b.id === stored)) return stored;
        return list[0]?.id ?? null;
      });
    } catch {
      setBabies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthPage]);

  function selectBaby(id: string) {
    setActiveBabyId(id);
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_BABY_KEY, id);
  }

  async function addBaby(payload: CreateBabyPayload): Promise<Baby> {
    const baby = await api.createBaby(payload);
    setBabies((prev) => [...prev, baby]);
    selectBaby(baby.id);
    return baby;
  }

  const activeBaby = useMemo(
    () => babies.find((b) => b.id === activeBabyId) ?? null,
    [babies, activeBabyId]
  );

  const value: BabyContextValue = {
    babies,
    activeBaby,
    loading,
    selectBaby,
    addBaby,
    refresh,
  };

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
}

export function useBaby(): BabyContextValue {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby must be used within a BabyProvider");
  return ctx;
}
