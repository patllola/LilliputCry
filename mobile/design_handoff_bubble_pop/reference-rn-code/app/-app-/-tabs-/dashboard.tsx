import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BabySummaryHeader } from "@/components/BabySummaryHeader";
import { BabySwitcherSheet } from "@/components/BabySwitcherSheet";
import { FeatureCard } from "@/components/FeatureCard";
import { FlowerDrop } from "@/components/FlowerDrop";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Baby } from "@/types/baby";

// Replace with your real data source (API / context / store).
const SEED_BABIES: Baby[] = [
  { id: "mia", name: "Mia", color: colors.accent, born: "Apr 21, 2025", bornDay: 21, age: "3 months old", weight: "6.2 kg", height: "61 cm", milestoneLabel: "3-month day!" },
  { id: "leo", name: "Leo", color: colors.pumpIcon, born: "Jan 8, 2024", bornDay: 8, age: "1 yr 6 mo", weight: "10.4 kg", height: "80 cm", milestoneLabel: "18-month day!" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [babies] = useState(SEED_BABIES);
  const [activeId, setActiveId] = useState(SEED_BABIES[0].id);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  const active = useMemo(
    () => babies.find((b) => b.id === activeId) ?? babies[0],
    [babies, activeId],
  );

  // Same day-of-month as the birth date => monthly "monthiversary".
  const isMonthiversary = new Date().getDate() === active.bornDay;

  const celebrate = useCallback(() => setPlayKey((k) => k + 1), []);

  const selectBaby = useCallback(
    (id: string) => {
      setActiveId(id);
      setSwitcherOpen(false);
      const next = babies.find((b) => b.id === id);
      if (next && new Date().getDate() === next.bornDay) celebrate();
    },
    [babies, celebrate],
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BabySummaryHeader
          baby={active}
          isMonthiversary={isMonthiversary}
          onPressSwitcher={() => setSwitcherOpen(true)}
          onPressCelebrate={celebrate}
        />

        <Text style={s.sectionTitle}>Track &amp; explore</Text>

        <View style={s.grid}>
          <FeatureCard
            title="Feeding" subtitle="6 logged today"
            tint={colors.feeding} iconColor={colors.feedingIcon}
            icon={<Text style={{ fontSize: 20 }}>🍼</Text>}
            onPress={() => router.push("/(app)/(tabs)/log")}
          />
          <FeatureCard
            title="Sleep" subtitle="5h 20m today"
            tint={colors.sleep} iconColor={colors.sleepIcon}
            icon={<Text style={{ fontSize: 20 }}>🌙</Text>}
            onPress={() => router.push("/(app)/sleep")}
          />
          <FeatureCard
            title="Milk Pump" subtitle="140ml pumped"
            tint={colors.pump} iconColor={colors.pumpIcon}
            icon={<Text style={{ fontSize: 20 }}>💧</Text>}
            onPress={() => router.push("/(app)/milk-pump")}
          />
          <FeatureCard
            title="Medication" subtitle="2 due today"
            tint={colors.medication} iconColor={colors.medicationIcon}
            icon={<Text style={{ fontSize: 20 }}>💊</Text>}
            onPress={() => router.push("/(app)/medication")}
          />
          <FeatureCard
            title="Milestones" subtitle="12 memories"
            tint={colors.milestone} iconColor={colors.milestoneIcon}
            icon={<Text style={{ fontSize: 20 }}>⭐</Text>}
            onPress={() => router.push("/(app)/milestone")}
          />
          <FeatureCard
            title="Refer" subtitle="Earn rewards"
            tint={colors.refer} iconColor={colors.referIcon}
            icon={<Text style={{ fontSize: 20 }}>🎁</Text>}
            onPress={() => router.push("/(app)/refer")}
          />
        </View>
      </ScrollView>

      <BabySwitcherSheet
        visible={switcherOpen}
        babies={babies}
        activeId={activeId}
        onSelect={selectBaby}
        onAddBaby={() => {
          setSwitcherOpen(false);
          router.push("/(app)/add-baby");
        }}
        onClose={() => setSwitcherOpen(false)}
      />

      {isMonthiversary ? <FlowerDrop playKey={playKey} /> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 32 },
  sectionTitle: { fontSize: 14, color: colors.text, fontFamily: fonts.black, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
