import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
};

/** Big +/- stepper — the primary way to enter a number without a keyboard. */
export function Stepper({ value, onChange, step = 10, min = 0, max = 9999, unit }: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <View style={s.row}>
      <Pressable
        accessibilityLabel="Decrease"
        style={[s.btn, s.btnGhost]}
        onPress={() => onChange(clamp(value - step))}
      >
        <Text style={s.ghostGlyph}>−</Text>
      </Pressable>

      <Text style={s.value}>
        {value}
        {unit ? <Text style={s.unit}>{unit}</Text> : null}
      </Text>

      <Pressable
        accessibilityLabel="Increase"
        style={[s.btn, s.btnSolid]}
        onPress={() => onChange(clamp(value + step))}
      >
        <Text style={s.solidGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 10,
  },
  btn: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  btnSolid: { backgroundColor: colors.accent },
  ghostGlyph: { fontSize: 26, lineHeight: 30, color: colors.text, fontFamily: fonts.black },
  solidGlyph: { fontSize: 26, lineHeight: 30, color: "#fff", fontFamily: fonts.black },
  value: { fontSize: 32, color: colors.text, fontFamily: fonts.black },
  unit: { fontSize: 14, fontFamily: fonts.bold },
});
