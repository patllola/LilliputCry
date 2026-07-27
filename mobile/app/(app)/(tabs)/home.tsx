import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/api";
import { BabySummaryHeader } from "@/components/BabySummaryHeader";
import { BabySwitcherModal } from "@/components/BabySwitcherModal";
import { Button } from "@/components/Button";
import { FeatureCard } from "@/components/FeatureCard";
import { FlowerDrop } from "@/components/FlowerDrop";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useBaby } from "@/lib/babyContext";
import { planSubtitle } from "@/lib/mockSubscription";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

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

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ celebrate?: string }>();
  const { babies, activeBaby, loading: babyLoading } = useBaby();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (params.celebrate === "1") {
      setPlayKey((k) => k + 1);
      router.setParams({ celebrate: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.celebrate]);

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
            feedings.status === "fulfilled" ? feedings.value.filter((l) => isToday(l.fedAt)).length : 0,
          sleepMinutesToday:
            sleep.status === "fulfilled"
              ? sleep.value.filter((l) => isToday(l.sleepEnd)).reduce((sum, l) => sum + l.durationMinutes, 0)
              : 0,
          pumpMlToday:
            pump.status === "fulfilled"
              ? pump.value.filter((p) => isToday(p.pumpedAt)).reduce((sum, p) => sum + p.totalAmount, 0)
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

  const cards = useMemo(
    () => [
      {
        route: "/log",
        title: "Feeding",
        subtitle: `${stats.feedingsToday} logged today`,
        tint: colors.feeding,
        icon: <MaterialCommunityIcons name="baby-bottle-outline" size={21} color={colors.feedingIcon} />,
      },
      {
        route: "/sleep",
        title: "Sleep",
        subtitle: `${fmtDuration(stats.sleepMinutesToday)} today`,
        tint: colors.sleep,
        icon: <Feather name="moon" size={21} color={colors.sleepIcon} />,
      },
      {
        route: "/milk-pump",
        title: "Milk Pump",
        subtitle: `${stats.pumpMlToday}ml pumped`,
        tint: colors.pump,
        icon: <Feather name="droplet" size={21} color={colors.pumpIcon} />,
      },
      {
        route: "/medications",
        title: "Medication",
        subtitle: `${stats.medsDue} due today`,
        tint: colors.medication,
        icon: <MaterialCommunityIcons name="pill" size={21} color={colors.medicationIcon} />,
      },
      {
        route: "/payment-plan",
        title: "Payment Plan",
        subtitle: planSubtitle(),
        tint: colors.plan,
        icon: <Feather name="credit-card" size={21} color={colors.planIcon} />,
      },
      {
        route: "/milestone",
        title: "Milestones",
        subtitle: `${stats.milestoneCount} memories`,
        tint: colors.milestone,
        icon: <Feather name="star" size={21} color={colors.milestoneIcon} />,
      },
      {
        route: "/refer",
        title: "Refer",
        subtitle: "Earn rewards",
        tint: colors.refer,
        icon: <Feather name="gift" size={21} color={colors.referIcon} />,
      },
      {
        route: "/history",
        title: "History",
        subtitle: "View trends",
        tint: colors.history,
        icon: <Feather name="bar-chart-2" size={21} color={colors.historyIcon} />,
      },
    ],
    [stats]
  );

  if (babyLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (babies.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👶</Text>
          <Text style={styles.emptyTitle}>Add your baby to get started</Text>
          <Text style={styles.emptyText}>Create a profile to start tracking feedings, sleep, and more.</Text>
          <Button title="Add a Baby" onPress={() => router.push("/add-baby")} style={styles.emptyBtn} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        {activeBaby && (
          <BabySummaryHeader
            baby={activeBaby}
            onPressSwitcher={() => setSwitcherOpen(true)}
            onPressCelebrate={() => setPlayKey((k) => k + 1)}
          />
        )}

        <Text style={styles.sectionTitle}>Track & explore</Text>
        <View style={styles.grid}>
          {cards.map((card) => (
            <FeatureCard
              key={card.route}
              title={card.title}
              subtitle={card.subtitle}
              tint={card.tint}
              icon={card.icon}
              onPress={() => router.push(card.route as never)}
            />
          ))}
        </View>
      </ScreenContainer>

      <FlowerDrop playKey={playKey} />
      <BabySwitcherModal visible={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 18, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text, textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: fonts.semi, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.text, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
