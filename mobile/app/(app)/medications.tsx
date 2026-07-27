import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChipRow } from "@/components/ChipRow";
import { ClockDial } from "@/components/ClockDial";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { Stepper } from "@/components/Stepper";
import { useBaby } from "@/lib/babyContext";
import {
  cancelMedicationReminder,
  ensureNotificationPermission,
  scheduleMedicationReminder,
} from "@/lib/reminders";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Medication } from "@/types/medication";

const HOUR_LABELS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTE_LABELS = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const UNIT_OPTIONS = ["IU", "ml", "drops", "mg"] as const;
type Unit = (typeof UNIT_OPTIONS)[number];

export default function MedicationsScreen() {
  const { activeBaby } = useBaby();
  const [medications, setMedications] = useState<Medication[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(400);
  const [unit, setUnit] = useState<Unit>("IU");
  const [dialMode, setDialMode] = useState<"h" | "m">("h");
  const [medH, setMedH] = useState(9);
  const [medM, setMedM] = useState(0);
  const [medPm, setMedPm] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [remindMe, setRemindMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadMedications = useCallback(async () => {
    try {
      setMedications(await api.getMedications(activeBaby?.guidId));
    } catch {}
  }, [activeBaby?.guidId]);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  useEffect(() => {
    ensureNotificationPermission().catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Medicine name is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const dose = `${amount} ${unit}`;
      const timeOfDay = `${medH}:${String(medM).padStart(2, "0")} ${medPm ? "PM" : "AM"}`;
      const created = await api.createMedication({
        name: name.trim(),
        dose,
        timeOfDay,
        repeatDaily,
        reminderEnabled: remindMe,
        babyId: activeBaby?.guidId,
      });
      if (remindMe) {
        try {
          await scheduleMedicationReminder(created, repeatDaily);
        } catch {}
      }
      setSuccess(true);
      setName("");
      await loadMedications();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(m: Medication) {
    setMedications((prev) =>
      prev.map((x) => (x.guidId === m.guidId ? { ...x, isDoneToday: !x.isDoneToday } : x))
    );
    try {
      await api.toggleMedicationDone(m.guidId);
    } catch {
      loadMedications();
    }
  }

  async function toggleReminder(m: Medication) {
    const next = !m.reminderEnabled;
    setMedications((prev) =>
      prev.map((x) => (x.guidId === m.guidId ? { ...x, reminderEnabled: next } : x))
    );
    try {
      const updated = await api.toggleMedicationReminder(m.guidId);
      try {
        if (updated.reminderEnabled) {
          await scheduleMedicationReminder(updated, updated.repeatDaily);
        } else {
          await cancelMedicationReminder(updated.guidId);
        }
      } catch {}
    } catch {
      loadMedications();
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMedication(id);
      setMedications((prev) => prev.filter((x) => x.guidId !== id));
    } catch {}
  }

  return (
    <ScreenShell title="Medication">
      <View style={styles.reminderBanner}>
        <Text style={styles.reminderBannerText}>
          🔔 Reminders on — we&apos;ll alert you at each dose time.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Today&apos;s schedule</Text>
      {medications.length === 0 ? (
        <Text style={styles.emptyText}>No medications yet. Add one below.</Text>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(m) => m.guidId}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.medRow}>
              <TouchableOpacity
                onPress={() => toggleDone(item)}
                style={[styles.checkCircle, item.isDoneToday && styles.checkCircleDone]}
              >
                {item.isDoneToday && <Feather name="check" size={16} color="#fff" />}
              </TouchableOpacity>
              <View style={styles.medInfo}>
                <Text style={[styles.medName, item.isDoneToday && styles.medNameDone]}>
                  {item.name}
                </Text>
                <Text style={styles.medMeta}>
                  {item.dose ? `${item.dose} · ` : ""}
                  {item.timeOfDay}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleReminder(item)}
                style={[styles.bellBtn, item.reminderEnabled ? styles.bellBtnOn : styles.bellBtnOff]}
              >
                <Feather
                  name="bell"
                  size={16}
                  color={item.reminderEnabled ? colors.success : colors.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.guidId)} hitSlop={8}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Text style={[styles.sectionLabel, styles.addLabel]}>Add medication</Text>
      <Card style={styles.card}>
        <FormField
          label="Medicine name"
          placeholder="e.g. Vitamin D drops"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>Dose</Text>
        <Stepper
          value={amount}
          onChange={setAmount}
          step={unit === "IU" ? 100 : 1}
          max={5000}
          unit={unit}
        />
        <View style={styles.chipSpacer}>
          <ChipRow options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
        </View>

        <Text style={styles.fieldLabel}>Dose time</Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[styles.pill, dialMode === "h" ? styles.pillOn : styles.pillOff]}
            onPress={() => setDialMode("h")}
          >
            <Text style={[styles.pillText, dialMode === "h" ? styles.pillTextOn : styles.pillTextOff]}>
              {medH}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, dialMode === "m" ? styles.pillOn : styles.pillOff]}
            onPress={() => setDialMode("m")}
          >
            <Text style={[styles.pillText, dialMode === "m" ? styles.pillTextOn : styles.pillTextOff]}>
              {String(medM).padStart(2, "0")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, styles.pillOn]} onPress={() => setMedPm((p) => !p)}>
            <Text style={[styles.pillText, styles.pillTextOn]}>{medPm ? "PM" : "AM"}</Text>
          </TouchableOpacity>
        </View>

        {dialMode === "h" ? (
          <ClockDial
            labels={HOUR_LABELS}
            selectedIndex={medH === 12 ? 0 : medH}
            onChange={(i) => setMedH(i === 0 ? 12 : i)}
          />
        ) : (
          <ClockDial
            labels={MINUTE_LABELS}
            selectedIndex={medM / 5}
            onChange={(i) => setMedM(i * 5)}
          />
        )}

        <Text style={styles.readout}>
          {medH}:{String(medM).padStart(2, "0")} {medPm ? "PM" : "AM"}
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Repeat daily</Text>
          <Switch
            value={repeatDaily}
            onValueChange={setRepeatDaily}
            trackColor={{ false: colors.line, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Remind me 🔔</Text>
          <Switch
            value={remindMe}
            onValueChange={setRemindMe}
            trackColor={{ false: colors.line, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>

        {error && <Banner message={error} />}
        {success && <Banner message="Medication added!" variant="success" />}

        <Button
          title={success ? "Added!" : "Add Medication"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submit}
        />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  reminderBanner: {
    backgroundColor: colors.successBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  reminderBannerText: { fontSize: 12.5, fontFamily: fonts.bold, color: colors.success },
  sectionLabel: { fontSize: 14, fontFamily: fonts.black, color: colors.text, marginBottom: 10 },
  addLabel: { marginTop: 20 },
  emptyText: { fontSize: 13, fontFamily: fonts.semi, color: colors.muted, marginBottom: 10 },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDone: { backgroundColor: colors.success, borderColor: colors.success },
  medInfo: { flex: 1 },
  medName: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  medNameDone: { textDecorationLine: "line-through", opacity: 0.5 },
  medMeta: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtnOn: { backgroundColor: colors.successBg },
  bellBtnOff: { backgroundColor: colors.bg },
  deleteBtn: { fontSize: 15, fontFamily: fonts.black, color: colors.danger, paddingHorizontal: 6 },
  card: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: fonts.black,
    color: colors.text,
    marginBottom: 8,
    marginTop: 14,
  },
  chipSpacer: { marginTop: 12 },
  pillRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line },
  pillText: { fontSize: 13, fontFamily: fonts.black },
  pillTextOn: { color: "#fff" },
  pillTextOff: { color: colors.muted },
  readout: {
    fontSize: 24,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: "center",
    marginTop: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  toggleLabel: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.text },
  submit: { marginTop: 18 },
});
