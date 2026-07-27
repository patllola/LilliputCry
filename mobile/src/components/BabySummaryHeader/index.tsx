import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { formatBabyAge, formatShortDate, isMonthiversary, monthiversaryLabel } from "@/lib/babyFormat";
import type { Baby } from "@/types/baby";

type Props = {
  baby: Baby;
  onPressSwitcher: () => void;
  onPressCelebrate: () => void;
};

/** Gradient hero: baby switcher + born / weight / height at a glance. */
export function BabySummaryHeader({ baby, onPressSwitcher, onPressCelebrate }: Props) {
  const monthiversary = isMonthiversary(baby.dateOfBirth);

  return (
    <LinearGradient
      colors={[colors.heroFrom, colors.heroTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.hero}
    >
      <View style={s.topRow}>
        <Pressable onPress={onPressSwitcher} style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{baby.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={s.name}>{baby.name} ⌄</Text>
            <Text style={s.age}>{formatBabyAge(baby.dateOfBirth)}</Text>
          </View>
        </Pressable>

        {monthiversary ? (
          <Pressable onPress={onPressCelebrate} style={s.badge}>
            <Text style={s.badgeText}>
              🌸{"\n"}
              {monthiversaryLabel(baby.dateOfBirth)}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={s.stats}>
        <Stat label="Born" value={formatShortDate(baby.dateOfBirth)} />
        <Stat label="Weight" value={baby.weightKg != null ? `${baby.weightKg} kg` : "—"} />
        <Stat label="Height" value={baby.heightCm != null ? `${baby.heightCm} cm` : "—"} />
      </View>
    </LinearGradient>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 28, padding: 18, marginBottom: 20, overflow: "hidden" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  identity: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: {
    width: 50, height: 50, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,.28)", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 21, color: "#fff", fontFamily: fonts.black },
  name: { fontSize: 20, color: "#fff", fontFamily: fonts.black },
  age: { fontSize: 12, color: "rgba(255,255,255,.9)", fontFamily: fonts.bold },
  badge: { backgroundColor: "rgba(255,255,255,.24)", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 11 },
  badgeText: { fontSize: 11.5, color: "#fff", fontFamily: fonts.black, textAlign: "center" },
  stats: { flexDirection: "row", gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,.16)", borderRadius: 15, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 10.5, color: "rgba(255,255,255,.85)", fontFamily: fonts.bold },
  statValue: { fontSize: 13.5, color: "#fff", fontFamily: fonts.black, marginTop: 1 },
});
