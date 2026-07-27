import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ClockDial } from "@/components/ClockDial";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { SleepLog } from "@/types/sleep";

const HOUR_LABELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTE_LABELS = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const MODE_OPTIONS = [
  { value: "night" as const, label: "🌙 Night" },
  { value: "nap" as const, label: "🛏 Nap" },
];

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

export default function SleepScreen() {
  const { activeBaby } = useBaby();
  const [mode, setMode] = useState<"night" | "nap">("night");
  const [dialMode, setDialMode] = useState<"h" | "m">("h");
  const [sleepH, setSleepH] = useState(1);
  const [sleepM, setSleepM] = useState(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<SleepLog[]>([]);

  const isNap = mode === "nap";

  useEffect(() => { loadLogs(); }, [activeBaby?.guidId]);

  async function loadLogs() {
    try { setLogs(await api.getSleepLogs(activeBaby?.guidId)); } catch {}
  }

  async function handleSubmit() {
    const totalMinutes = sleepH * 60 + sleepM;
    if (totalMinutes <= 0) { setError("Enter a valid duration."); return; }
    if (totalMinutes > 1440) { setError("Duration cannot exceed 24 hours."); return; }

    const sleepEnd = new Date();
    const sleepStart = new Date(sleepEnd.getTime() - totalMinutes * 60 * 1000);

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
      setNotes("");
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

  const readout = sleepH === 0 ? `${sleepM}m` : sleepM === 0 ? `${sleepH}h` : `${sleepH}h ${sleepM}m`;

  return (
    <ScreenShell title="Sleep">
      <Card>
        <SegmentedToggle options={MODE_OPTIONS} value={mode} onChange={setMode} />

        <Text style={styles.durationCaption}>Duration</Text>

        <View style={styles.pillRow}>
          <Pressable
            style={[styles.pill, dialMode === "h" ? styles.pillOn : styles.pillOff]}
            onPress={() => setDialMode("h")}
          >
            <Text style={[styles.pillText, dialMode === "h" ? styles.pillTextOn : styles.pillTextOff]}>
              {sleepH}h
            </Text>
          </Pressable>
          <Pressable
            style={[styles.pill, dialMode === "m" ? styles.pillOn : styles.pillOff]}
            onPress={() => setDialMode("m")}
          >
            <Text style={[styles.pillText, dialMode === "m" ? styles.pillTextOn : styles.pillTextOff]}>
              {sleepM}m
            </Text>
          </Pressable>
        </View>

        {dialMode === "h" ? (
          <ClockDial labels={HOUR_LABELS} selectedIndex={sleepH} onChange={setSleepH} />
        ) : (
          <ClockDial labels={MINUTE_LABELS} selectedIndex={sleepM / 5} onChange={(i) => setSleepM(i * 5)} />
        )}

        <Text style={styles.readout}>{readout}</Text>

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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  durationCaption: {
    fontSize: 12.5,
    fontFamily: fonts.black,
    color: colors.muted,
    textAlign: "center",
    marginVertical: 12,
  },
  pillRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 14 },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line },
  pillText: { fontSize: 13, fontFamily: fonts.black },
  pillTextOn: { color: "#fff" },
  pillTextOff: { color: colors.muted },
  readout: { fontSize: 26, fontFamily: fonts.black, color: colors.text, textAlign: "center", marginTop: 14 },
  submit: { marginTop: 20 },
  historyTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.text, marginTop: 18, marginBottom: 10 },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
    gap: 10,
  },
  logBadge: {
    backgroundColor: colors.sleep,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logBadgeText: { fontSize: 10, fontFamily: fonts.black, color: colors.sleepIcon },
  logInfo: { flex: 1 },
  logDuration: { fontSize: 16, fontFamily: fonts.black, color: colors.text },
  logTime: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  logNotes: { fontSize: 12, fontFamily: fonts.medium, color: colors.muted, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.danger, paddingHorizontal: 6 },
});
