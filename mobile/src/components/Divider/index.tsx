import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type DividerProps = {
  /** When provided, renders a centered label (e.g. "or") between two lines. */
  label?: string;
};

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View style={styles.plain} />;
  }
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  plain: { height: 1, backgroundColor: colors.borderLight, marginVertical: 16 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  text: { marginHorizontal: 12, color: colors.textSubtle, fontSize: 12, fontWeight: "600" },
});
