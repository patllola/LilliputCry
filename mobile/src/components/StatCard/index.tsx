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
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.brand },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
