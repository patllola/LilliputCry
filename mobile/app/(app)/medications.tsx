import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { MenuButton } from "@/components/MenuButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import type { Medication } from "@/types/medication";

function to12Hour(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

export default function MedicationsScreen() {
  const { activeBaby } = useBaby();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
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

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Medicine name is required.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Enter time as HH:MM (24-hour).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.createMedication({
        name: name.trim(),
        dose: dose.trim() || undefined,
        timeOfDay: to12Hour(time),
        repeatDaily,
        reminderEnabled,
        babyId: activeBaby?.guidId,
      });
      setSuccess(true);
      setName("");
      setDose("");
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
    setMedications((prev) =>
      prev.map((x) => (x.guidId === m.guidId ? { ...x, reminderEnabled: !x.reminderEnabled } : x))
    );
    try {
      await api.toggleMedicationReminder(m.guidId);
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
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        <ScreenHeading title="Medication" subtitle="Keep track of doses and reminders" />

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
                  {item.isDoneToday && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, item.isDoneToday && styles.medNameDone]}>{item.name}</Text>
                  <Text style={styles.medMeta}>
                    {item.dose ? `${item.dose} · ` : ""}
                    {item.timeOfDay}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => toggleReminder(item)} style={styles.bellBtn}>
                  <Text style={styles.bellIcon}>{item.reminderEnabled ? "🔔" : "🔕"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.guidId)}>
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
          <View style={styles.row}>
            <View style={styles.half}>
              <FormField label="Dose" placeholder="400 IU" value={dose} onChangeText={setDose} />
            </View>
            <View style={styles.half}>
              <FormField label="Time (24h)" placeholder="09:00" value={time} onChangeText={setTime} />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Repeat daily</Text>
            <Switch
              value={repeatDaily}
              onValueChange={setRepeatDaily}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Remind me 🔔</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.border, true: colors.brand }}
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
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  reminderBanner: {
    backgroundColor: colors.successBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  reminderBannerText: { fontSize: 12.5, fontWeight: "700", color: colors.success },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: colors.label, marginBottom: 10 },
  addLabel: { marginTop: 20 },
  emptyText: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: "#fff", fontWeight: "800", fontSize: 13 },
  medInfo: { flex: 1 },
  medName: { fontSize: 14, fontWeight: "800", color: colors.text },
  medNameDone: { textDecorationLine: "line-through", opacity: 0.5 },
  medMeta: { fontSize: 11.5, fontWeight: "600", color: colors.textMuted, marginTop: 2 },
  bellBtn: { paddingHorizontal: 6 },
  bellIcon: { fontSize: 16 },
  deleteBtn: { fontSize: 15, color: colors.danger, paddingHorizontal: 6 },
  card: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  toggleLabel: { fontSize: 13.5, fontWeight: "700", color: colors.label },
  submit: { marginTop: 18 },
});
