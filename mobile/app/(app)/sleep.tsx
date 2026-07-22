import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
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
import type { SleepLog } from "@/types/sleep";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const QUICK_DURATIONS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
];

export default function SleepScreen() {
  const { activeBaby } = useBaby();
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isNap, setIsNap] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<SleepLog[]>([]);

  useEffect(() => { loadLogs(); }, [activeBaby?.guidId]);

  async function loadLogs() {
    try { setLogs(await api.getSleepLogs(activeBaby?.guidId)); } catch {}
  }

  async function handleSubmit() {
    const mins = parseFloat(durationMinutes);
    if (isNaN(mins) || mins <= 0) { setError("Enter a valid duration in minutes."); return; }
    if (mins > 1440) { setError("Duration cannot exceed 24 hours."); return; }

    const sleepEnd = new Date();
    const sleepStart = new Date(sleepEnd.getTime() - mins * 60 * 1000);

    setError(null);
    setLoading(true);
    try {
      await api.createSleepLog({
        sleepStart: sleepStart.toISOString(),
        sleepEnd: sleepEnd.toISOString(),
        isNap,
        notes: notes.trim() || undefined,
        babyId: activeBaby?.guidId,
      });
      setSuccess(true);
      setDurationMinutes(""); setNotes("");
      await loadLogs();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteSleepLog(id);
      setLogs(l => l.filter(x => x.guidId !== id));
    } catch {}
  }

  return (
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        <ScreenHeading title="Sleep Tracker" subtitle="Log naps and night sleep sessions" />

        <Card style={styles.card}>
          {/* Nap / Full sleep toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Night Sleep</Text>
            <Switch
              value={isNap}
              onValueChange={setIsNap}
              trackColor={{ false: colors.brand, true: colors.brand }}
              thumbColor={colors.surface}
            />
            <Text style={styles.toggleLabel}>Nap</Text>
          </View>

          {/* Quick duration presets */}
          <Text style={styles.fieldLabel}>Quick Duration</Text>
          <View style={styles.presets}>
            {QUICK_DURATIONS.map(d => (
              <TouchableOpacity
                key={d.label}
                style={[
                  styles.preset,
                  durationMinutes === String(d.minutes) && styles.presetActive,
                ]}
                onPress={() => setDurationMinutes(String(d.minutes))}
              >
                <Text style={[
                  styles.presetText,
                  durationMinutes === String(d.minutes) && styles.presetTextActive,
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="Duration (minutes)"
            placeholder="e.g. 90"
            keyboardType="decimal-pad"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
          />

          {durationMinutes !== "" && !isNaN(parseFloat(durationMinutes)) && (
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {isNap ? "🛏  Nap" : "🌙  Night Sleep"} · {formatDuration(parseFloat(durationMinutes))}
              </Text>
            </View>
          )}

          <FormField
            label="Notes (optional)"
            placeholder="e.g. slept through, woke once..."
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />

          {error && <Banner message={error} />}
          {success && <Banner message="Sleep session saved!" variant="success" />}

          <Button
            title={success ? "Saved!" : "Log Sleep"}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submit}
          />
        </Card>

        {logs.length > 0 && (
          <>
            <Text style={styles.historyTitle}>Recent Sleep Sessions</Text>
            <FlatList
              data={logs.slice(0, 10)}
              keyExtractor={i => i.guidId}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.logRow}>
                  <View style={styles.logBadge}>
                    <Text style={styles.logBadgeText}>{item.isNap ? "NAP" : "SLEEP"}</Text>
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={styles.logDuration}>{formatDuration(item.durationMinutes)}</Text>
                    <Text style={styles.logTime}>
                      {formatDateTime(item.sleepStart)} → {formatDateTime(item.sleepEnd)}
                    </Text>
                    {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.guidId)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  card: { marginBottom: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: colors.label },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.label, marginBottom: 8 },
  presets: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  presetText: { fontSize: 13, color: colors.label },
  presetTextActive: { color: "#fff", fontWeight: "700" },
  preview: {
    backgroundColor: colors.brandTint,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: "center",
  },
  previewText: { fontSize: 14, fontWeight: "600", color: colors.brandText },
  submit: { marginTop: 8 },
  historyTitle: { fontSize: 14, fontWeight: "700", color: colors.label, marginBottom: 10 },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  logBadge: {
    backgroundColor: colors.brandTint,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  logBadgeText: { fontSize: 10, fontWeight: "700", color: colors.brand },
  logInfo: { flex: 1 },
  logDuration: { fontSize: 16, fontWeight: "700", color: colors.text },
  logTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  logNotes: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.danger, paddingHorizontal: 6 },
});
