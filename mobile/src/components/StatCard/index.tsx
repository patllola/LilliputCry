import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

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
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  statValue: { fontSize: 18, fontFamily: fonts.black, color: colors.accent },
  statLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
});
