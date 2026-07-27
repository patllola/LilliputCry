import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ChipRow } from "@/components/ChipRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenShell } from "@/components/ScreenShell";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { Stepper } from "@/components/Stepper";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const PRESETS = [30, 60, 90, 120, 180] as const;
const MODES = [
  { value: "night" as const, label: "🌙 Night" },
  { value: "nap" as const, label: "🛏 Nap" },
];

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function SleepScreen() {
  const [mode, setMode] = useState<"night" | "nap">("night");
  const [mins, setMins] = useState(90);
  const [notes, setNotes] = useState("");

  return (
    <ScreenShell title="Log Sleep">
      <View style={s.card}>
        <SegmentedToggle options={MODES} value={mode} onChange={setMode} />

        <Text style={s.centerLabel}>Duration</Text>
        {/* Stepper renders the raw number; we show the formatted value below it. */}
        <Stepper value={mins} onChange={setMins} step={15} min={15} max={1440} />
        <Text style={s.readout}>{formatDuration(mins)}</Text>

        <View style={{ marginTop: 14 }}>
          <ChipRow
            options={PRESETS}
            value={mins as (typeof PRESETS)[number]}
            onChange={setMins}
            format={formatDuration}
          />
        </View>

        <Text style={[s.label, { marginTop: 18 }]}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. slept through, woke once…"
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <PrimaryButton label="Log Sleep" onPress={() => { /* TODO: api.createSleep(...) */ }} />
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 24, padding: 18 },
  label: { fontSize: 12.5, color: colors.text, fontFamily: fonts.black, marginBottom: 8 },
  centerLabel: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.black, textAlign: "center", marginTop: 18, marginBottom: 6 },
  readout: { fontSize: 15, color: colors.text, fontFamily: fonts.black, textAlign: "center", marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: colors.line, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg, fontFamily: fonts.semi,
  },
});
