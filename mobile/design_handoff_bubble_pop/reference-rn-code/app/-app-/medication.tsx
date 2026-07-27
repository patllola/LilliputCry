import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { ChipRow } from "@/components/ChipRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenShell } from "@/components/ScreenShell";
import { Stepper } from "@/components/Stepper";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Medication } from "@/types/baby";
import { scheduleMedicationReminder, cancelMedicationReminder } from "@/lib/reminders";

const UNITS = ["IU", "ml", "drops", "mg"] as const;
const TIMES = ["Morning", "9:00 AM", "After feed", "6:00 PM", "Bedtime"] as const;

const SEED: Medication[] = [
  { id: "m1", babyId: "mia", name: "Vitamin D drops", dose: "400 IU", time: "9:00 AM", reminder: true, done: true },
  { id: "m2", babyId: "mia", name: "Iron supplement", dose: "1 ml", time: "6:00 PM", reminder: true, done: false },
  { id: "m3", babyId: "mia", name: "Probiotic", dose: "5 drops", time: "After feed", reminder: false, done: false },
];

export default function MedicationScreen() {
  const [meds, setMeds] = useState(SEED);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(400);
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("IU");
  const [time, setTime] = useState<(typeof TIMES)[number]>("9:00 AM");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [remindMe, setRemindMe] = useState(true);

  const toggle = (id: string, key: "done" | "reminder") =>
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const next = { ...m, [key]: !m[key] };
        if (key === "reminder") {
          next.reminder ? scheduleMedicationReminder(next) : cancelMedicationReminder(next.id);
        }
        return next;
      }),
    );

  const addMedication = () => {
    const med: Medication = {
      id: `med${Date.now()}`,
      babyId: "mia",
      name: name.trim() || "New medication",
      dose: `${amount} ${unit}`,
      time,
      reminder: remindMe,
      done: false,
    };
    setMeds((prev) => [...prev, med]);
    if (remindMe) scheduleMedicationReminder(med, repeatDaily);
    setName("");
  };

  return (
    <ScreenShell title="Medication">
      <View style={s.banner}>
        <Text style={s.bannerText}>🔔  Reminders on — we'll alert you at each dose time.</Text>
      </View>

      <Text style={s.sectionTitle}>Today's schedule</Text>
      <View style={{ gap: 10 }}>
        {meds.map((m) => (
          <View key={m.id} style={s.row}>
            <Pressable
              onPress={() => toggle(m.id, "done")}
              style={[s.check, m.done && s.checkOn]}
            >
              {m.done ? <Text style={s.checkGlyph}>✓</Text> : null}
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={[s.medName, m.done && s.medNameDone]}>{m.name}</Text>
              <Text style={s.medMeta}>{m.dose} · {m.time}</Text>
            </View>

            <Pressable
              onPress={() => toggle(m.id, "reminder")}
              style={[s.bell, m.reminder && s.bellOn]}
            >
              <Text style={{ fontSize: 15, opacity: m.reminder ? 1 : 0.35 }}>🔔</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={[s.sectionTitle, { marginTop: 20 }]}>Add medication</Text>
      <View style={s.card}>
        <Text style={s.label}>Medicine name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Vitamin D drops"
          placeholderTextColor={colors.muted}
          style={s.input}
        />

        <Text style={[s.label, { marginTop: 16 }]}>Dose</Text>
        <Stepper
          value={amount}
          onChange={setAmount}
          step={unit === "IU" ? 100 : 1}
          max={5000}
          unit={unit}
        />
        <View style={{ marginTop: 10 }}>
          <ChipRow options={UNITS} value={unit} onChange={setUnit} />
        </View>

        <Text style={[s.label, { marginTop: 18 }]}>Dose time</Text>
        <ChipRow options={TIMES} value={time} onChange={setTime} />

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Repeat daily</Text>
          <Switch
            value={repeatDaily}
            onValueChange={setRepeatDaily}
            trackColor={{ true: colors.accent, false: colors.line }}
            thumbColor="#fff"
          />
        </View>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Remind me 🔔</Text>
          <Switch
            value={remindMe}
            onValueChange={setRemindMe}
            trackColor={{ true: colors.accent, false: colors.line }}
            thumbColor="#fff"
          />
        </View>

        <PrimaryButton label="Add Medication" onPress={addMedication} />
      </View>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  banner: { backgroundColor: colors.medication, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 16 },
  bannerText: { fontSize: 12.5, color: "#1f8f70", fontFamily: fonts.black },
  sectionTitle: { fontSize: 14, color: colors.text, fontFamily: fonts.black, marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 20, padding: 12,
  },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.medicationIcon, borderColor: colors.medicationIcon },
  checkGlyph: { color: "#fff", fontSize: 15, fontFamily: fonts.black },
  medName: { fontSize: 14, color: colors.text, fontFamily: fonts.black },
  medNameDone: { textDecorationLine: "line-through", opacity: 0.5 },
  medMeta: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.bold },
  bell: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  bellOn: { backgroundColor: colors.medication },
  card: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 24, padding: 18 },
  label: { fontSize: 12.5, color: colors.text, fontFamily: fonts.black, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: colors.line, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg, fontFamily: fonts.semi,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  switchLabel: { fontSize: 13.5, color: colors.text, fontFamily: fonts.black },
});
