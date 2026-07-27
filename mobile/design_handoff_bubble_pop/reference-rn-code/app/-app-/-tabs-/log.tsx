import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ChipRow } from "@/components/ChipRow";
import { DialGauge } from "@/components/DialGauge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenShell } from "@/components/ScreenShell";
import { Stepper } from "@/components/Stepper";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const PREP_PRESETS = [60, 90, 120, 150] as const;

export default function LogFeedScreen() {
  const [prepared, setPrepared] = useState(120);
  const [fed, setFed] = useState(108);
  const [notes, setNotes] = useState("");

  const waste = Math.max(0, prepared - fed);
  const wastePct = prepared > 0 ? Math.round((waste / prepared) * 100) : 0;

  // Fed can never exceed what was prepared.
  const setPreparedSafe = (next: number) => {
    setPrepared(next);
    setFed((f) => Math.min(f, next));
  };

  return (
    <ScreenShell title="Log a Feed">
      <View style={s.card}>
        <Text style={s.label}>Milk prepared</Text>
        <Stepper value={prepared} onChange={setPreparedSafe} step={10} max={400} unit="ml" />
        <View style={{ marginTop: 10 }}>
          <ChipRow
            options={PREP_PRESETS}
            value={prepared as (typeof PREP_PRESETS)[number]}
            onChange={setPreparedSafe}
            format={(v) => `${v}ml`}
          />
        </View>

        <Text style={[s.label, { marginTop: 18 }]}>Milk fed</Text>
        <Stepper value={fed} onChange={setFed} step={10} max={prepared} unit="ml" />

        <View style={s.wasteRow}>
          <DialGauge
            value={wastePct}
            max={100}
            size={74}
            unit="%"
            color={colors.accent}
            trackColor={colors.line}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.wasteTitle}>Waste this feed</Text>
            <Text style={s.wasteMeta}>{waste}ml left in bottle</Text>
          </View>
        </View>

        <Text style={[s.label, { marginTop: 18 }]}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any observations…"
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <PrimaryButton label="Log Feeding" onPress={() => { /* TODO: api.createFeeding(...) */ }} />
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 24, padding: 18 },
  label: { fontSize: 12.5, color: colors.text, fontFamily: fonts.black, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: colors.line, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg, fontFamily: fonts.semi,
  },
  wasteRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    marginTop: 18, backgroundColor: colors.bg, borderRadius: 20, padding: 14,
  },
  wasteTitle: { fontSize: 13, color: colors.text, fontFamily: fonts.black },
  wasteMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.bold },
});
