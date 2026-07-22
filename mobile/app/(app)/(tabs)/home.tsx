import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/api";
import { AddBabyModal } from "@/components/AddBabyModal";
import { BabySwitcherModal } from "@/components/BabySwitcherModal";
import { Button } from "@/components/Button";
import { MenuButton } from "@/components/MenuButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useBaby } from "@/lib/babyContext";
import {
  formatBabyAge,
  formatShortDate,
  isMonthiversary,
  monthiversaryLabel,
} from "@/lib/babyFormat";
import { colors } from "@/theme/colors";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type Stats = {
  feedingsToday: number;
  sleepMinutesToday: number;
  pumpMlToday: number;
  medsDue: number;
  milestoneCount: number;
};

const EMPTY_STATS: Stats = {
  feedingsToday: 0,
  sleepMinutesToday: 0,
  pumpMlToday: 0,
  medsDue: 0,
  milestoneCount: 0,
};

const TILES = [
  { route: "/log", emoji: "🍼", label: "Baby Feed", bg: "#ffe1ec", key: "feedingsToday", suffix: " logged today" },
  { route: "/sleep", emoji: "😴", label: "Sleep", bg: "#e7ddff", key: "sleepMinutesToday", suffix: " today" },
  { route: "/milk-pump", emoji: "🥛", label: "Milk Pump", bg: "#d9f0ff", key: "pumpMlToday", suffix: "ml pumped" },
  { route: "/medications", emoji: "💊", label: "Medication", bg: "#d7f5e8", key: "medsDue", suffix: " due today" },
  { route: "/milestone", emoji: "🌟", label: "Milestones", bg: "#fff2cf", key: "milestoneCount", suffix: " memories" },
  { route: "/refer", emoji: "🎁", label: "Refer", bg: "#ffe0d3", key: null, suffix: "Earn rewards" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { babies, activeBaby, loading: babyLoading } = useBaby();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  const monthiversary = activeBaby ? isMonthiversary(activeBaby.dateOfBirth) : false;

  useFocusEffect(
    useCallback(() => {
      if (!activeBaby) {
        setStats(EMPTY_STATS);
        return;
      }
      let cancelled = false;
      Promise.allSettled([
        api.getLogs(activeBaby.guidId),
        api.getSleepLogs(activeBaby.guidId),
        api.getPumpSessions(activeBaby.guidId),
        api.getMedications(activeBaby.guidId),
        api.getMilestones(activeBaby.guidId),
      ]).then(([feedings, sleep, pump, meds, milestones]) => {
        if (cancelled) return;
        setStats({
          feedingsToday:
            feedings.status === "fulfilled"
              ? feedings.value.filter((l) => isToday(l.fedAt)).length
              : 0,
          sleepMinutesToday:
            sleep.status === "fulfilled"
              ? sleep.value
                  .filter((l) => isToday(l.sleepEnd))
                  .reduce((sum, l) => sum + l.durationMinutes, 0)
              : 0,
          pumpMlToday:
            pump.status === "fulfilled"
              ? pump.value
                  .filter((p) => isToday(p.pumpedAt))
                  .reduce((sum, p) => sum + p.totalAmount, 0)
              : 0,
          medsDue: meds.status === "fulfilled" ? meds.value.filter((m) => !m.isDoneToday).length : 0,
          milestoneCount: milestones.status === "fulfilled" ? milestones.value.length : 0,
        });
      });
      return () => {
        cancelled = true;
      };
    }, [activeBaby?.guidId])
  );

  const subtitleFor = useMemo(
    () => (tile: (typeof TILES)[number]) => {
      if (tile.key === null) return tile.suffix;
      if (tile.key === "sleepMinutesToday") return `${fmtDuration(stats.sleepMinutesToday)}${tile.suffix}`;
      return `${stats[tile.key]}${tile.suffix}`;
    },
    [stats]
  );

  if (babyLoading) {
    return (
      <View style={styles.screen}>
        <MenuButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </View>
    );
  }

  if (babies.length === 0) {
    return (
      <View style={styles.screen}>
        <MenuButton />
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👶</Text>
          <Text style={styles.emptyTitle}>Add your baby to get started</Text>
          <Text style={styles.emptyText}>Create a profile to start tracking feedings, sleep, and more.</Text>
          <Button title="Add a Baby" onPress={() => setAddOpen(true)} style={styles.emptyBtn} />
        </View>
        <AddBabyModal visible={addOpen} onClose={() => setAddOpen(false)} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        {activeBaby && (
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.heroIdentity} onPress={() => setSwitcherOpen(true)} activeOpacity={0.85}>
                <View style={styles.heroAvatar}>
                  <Text style={styles.heroAvatarText}>{activeBaby.name[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.heroName}>{activeBaby.name} ▾</Text>
                  <Text style={styles.heroAge}>{formatBabyAge(activeBaby.dateOfBirth)}</Text>
                </View>
              </TouchableOpacity>
              {monthiversary && (
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeEmoji}>🌸</Text>
                  <Text style={styles.monthBadgeText}>{monthiversaryLabel(activeBaby.dateOfBirth)}</Text>
                </View>
              )}
            </View>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Born</Text>
                <Text style={styles.heroStatValue}>{formatShortDate(activeBaby.dateOfBirth)}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Weight</Text>
                <Text style={styles.heroStatValue}>
                  {activeBaby.weightKg != null ? `${activeBaby.weightKg} kg` : "—"}
                </Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Height</Text>
                <Text style={styles.heroStatValue}>
                  {activeBaby.heightCm != null ? `${activeBaby.heightCm} cm` : "—"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Track & explore</Text>
        <View style={styles.grid}>
          {TILES.map((tile) => (
            <TouchableOpacity
              key={tile.route}
              style={[styles.tile, { backgroundColor: tile.bg }]}
              onPress={() => router.push(tile.route as never)}
              activeOpacity={0.85}
            >
              <View style={styles.tileIcon}>
                <Text style={styles.tileIconText}>{tile.emoji}</Text>
              </View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileSubtitle}>{subtitleFor(tile)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScreenContainer>

      <BabySwitcherModal visible={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 6, marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 24 },
  hero: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.brand,
    marginBottom: 20,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroAvatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroName: { fontSize: 19, fontWeight: "800", color: "#fff" },
  heroAge: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  monthBadge: {
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  monthBadgeEmoji: { fontSize: 14 },
  monthBadgeText: { fontSize: 10.5, fontWeight: "800", color: "#fff", marginTop: 2, textAlign: "center" },
  heroStatsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  heroStat: { flex: 1, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 14, padding: 10 },
  heroStatLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  heroStatValue: { fontSize: 13, fontWeight: "800", color: "#fff", marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconText: { fontSize: 20 },
  tileLabel: { fontSize: 14.5, fontWeight: "800", color: colors.text },
  tileSubtitle: { fontSize: 11, fontWeight: "700", color: "rgba(17,24,39,0.5)" },
});
