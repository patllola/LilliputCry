import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api";
import type { Baby, CreateBabyPayload } from "@/types/baby";

const ACTIVE_BABY_KEY = "lilliputcry_active_baby";

interface BabyContextValue {
  babies: Baby[];
  activeBaby: Baby | null;
  loading: boolean;
  selectBaby: (guidId: string) => void;
  addBaby: (payload: CreateBabyPayload) => Promise<Baby>;
  refresh: () => Promise<void>;
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await api.getBabies();
      setBabies(list);
      const stored = await AsyncStorage.getItem(ACTIVE_BABY_KEY);
      setActiveBabyId((current) => {
        if (current && list.some((b) => b.guidId === current)) return current;
        if (stored && list.some((b) => b.guidId === stored)) return stored;
        return list[0]?.guidId ?? null;
      });
    } catch {
      setBabies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function selectBaby(guidId: string) {
    setActiveBabyId(guidId);
    AsyncStorage.setItem(ACTIVE_BABY_KEY, guidId).catch(() => {});
  }

  async function addBaby(payload: CreateBabyPayload): Promise<Baby> {
    const baby = await api.createBaby(payload);
    setBabies((prev) => [...prev, baby]);
    selectBaby(baby.guidId);
    return baby;
  }

  const activeBaby = useMemo(
    () => babies.find((b) => b.guidId === activeBabyId) ?? null,
    [babies, activeBabyId]
  );

  const value: BabyContextValue = { babies, activeBaby, loading, selectBaby, addBaby, refresh };

  return <BabyContext.Provider value={value}>{children}</BabyContext.Provider>;
}

export function useBaby(): BabyContextValue {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error("useBaby must be used within a BabyProvider");
  return ctx;
}
