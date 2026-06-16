import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.borderLight,
    elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.brand },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
