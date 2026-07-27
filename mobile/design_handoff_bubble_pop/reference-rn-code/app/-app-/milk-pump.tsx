import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DialGauge } from "@/components/DialGauge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenShell } from "@/components/ScreenShell";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const STEP = 5;
const MAX = 300;

export default function MilkPumpScreen() {
  const [left, setLeft] = useState(70);
  const [right, setRight] = useState(70);

  return (
    <ScreenShell title="Pump Session">
      <View style={s.card}>
        <View style={s.sides}>
          <Side label="LEFT" value={left} onChange={setLeft} />
          <Side label="RIGHT" value={right} onChange={setRight} />
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total pumped</Text>
          <Text style={s.totalValue}>{left + right} ml</Text>
        </View>

        <PrimaryButton label="Save Session" onPress={() => { /* TODO: api.createPumpSession(...) */ }} />
      </View>
    </ScreenShell>
  );
}

function Side({
  label, value, onChange,
}: { label: string; value: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(0, Math.min(MAX, n));
  return (
    <View style={s.side}>
      <Text style={s.sideLabel}>{label}</Text>
      <DialGauge value={value} max={150} />
      <View style={s.sideBtns}>
        <Pressable style={[s.btn, s.btnGhost]} onPress={() => onChange(clamp(value - STEP))}>
          <Text style={s.ghostGlyph}>−</Text>
        </Pressable>
        <Pressable style={[s.btn, s.btnSolid]} onPress={() => onChange(clamp(value + STEP))}>
          <Text style={s.solidGlyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 24, padding: 18 },
  sides: { flexDirection: "row", gap: 14 },
  side: { flex: 1, alignItems: "center" },
  sideLabel: { fontSize: 12, color: colors.muted, fontFamily: fonts.black, marginBottom: 8 },
  sideBtns: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  btnSolid: { backgroundColor: colors.accent },
  ghostGlyph: { fontSize: 22, lineHeight: 26, color: colors.text, fontFamily: fonts.black },
  solidGlyph: { fontSize: 22, lineHeight: 26, color: "#fff", fontFamily: fonts.black },
  totalRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.pump, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, marginTop: 18,
  },
  totalLabel: { fontSize: 13, color: "#3a7ba0", fontFamily: fonts.black },
  totalValue: { fontSize: 19, color: colors.pumpIcon, fontFamily: fonts.black },
});
