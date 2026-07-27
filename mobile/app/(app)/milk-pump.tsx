import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DialGauge } from "@/components/DialGauge";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { PumpSession } from "@/types/pump";

const STEP = 5;
const MIN = 0;
const MAX = 300;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MilkPumpScreen() {
  const { activeBaby } = useBaby();
  const [left, setLeft] = useState(70);
  const [right, setRight] = useState(70);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessions, setSessions] = useState<PumpSession[]>([]);

  useEffect(() => { loadSessions(); }, [activeBaby?.guidId]);

  async function loadSessions() {
    try { setSessions(await api.getPumpSessions(activeBaby?.guidId)); } catch {}
  }

  function clamp(n: number) {
    return Math.max(MIN, Math.min(MAX, n));
  }

  async function handleSubmit() {
    if (left === 0 && right === 0) {
      setError("At least one side must be greater than 0.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.createPumpSession({
        pumpedAt: new Date().toISOString(),
        leftAmount: left,
        rightAmount: right,
        notes: notes.trim() || undefined,
        babyId: activeBaby?.guidId,
      });
      setSuccess(true);
      setLeft(70); setRight(70); setNotes("");
      await loadSessions();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deletePumpSession(id);
      setSessions(s => s.filter(x => x.guidId !== id));
    } catch {}
  }

  const total = left + right;

  return (
    <ScreenShell title="Milk Pump">
      <Card>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>LEFT</Text>
            <DialGauge size={96} max={150} value={left} color={colors.pumpIcon} trackColor={colors.pump} />
            <View style={styles.stepRow}>
              <Pressable style={styles.stepBtnGhost} onPress={() => setLeft(clamp(left - STEP))}>
                <Text style={styles.stepGhostGlyph}>−</Text>
              </Pressable>
              <Pressable style={styles.stepBtnSolid} onPress={() => setLeft(clamp(left + STEP))}>
                <Text style={styles.stepSolidGlyph}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>RIGHT</Text>
            <DialGauge size={96} max={150} value={right} color={colors.pumpIcon} trackColor={colors.pump} />
            <View style={styles.stepRow}>
              <Pressable style={styles.stepBtnGhost} onPress={() => setRight(clamp(right - STEP))}>
                <Text style={styles.stepGhostGlyph}>−</Text>
              </Pressable>
              <Pressable style={styles.stepBtnSolid} onPress={() => setRight(clamp(right + STEP))}>
                <Text style={styles.stepSolidGlyph}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total pumped</Text>
          <Text style={styles.totalValue}>{total} ml</Text>
        </View>

        <FormField
          label="Notes (optional)"
          placeholder="Any observations..."
          multiline
          numberOfLines={2}
          value={notes}
          onChangeText={setNotes}
        />

        {error && <Banner message={error} />}
        {success && <Banner message="Session saved!" variant="success" />}

        <Button
          title={success ? "Saved!" : "Save Session"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submit}
        />
      </Card>

      {sessions.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Recent Sessions</Text>
          <FlatList
            data={sessions.slice(0, 10)}
            keyExtractor={i => i.guidId}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionDate}>{formatDate(item.pumpedAt)} · {formatTime(item.pumpedAt)}</Text>
                  <Text style={styles.sessionDetail}>
                    L: {item.leftAmount}ml  R: {item.rightAmount}ml  Total: {item.totalAmount}ml
                  </Text>
                  {item.notes && <Text style={styles.sessionNotes}>{item.notes}</Text>}
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
  row: { flexDirection: "row", gap: 14 },
  col: { flex: 1, alignItems: "center" },
  colLabel: { fontSize: 12, fontFamily: fonts.black, color: colors.muted, marginBottom: 8 },
  stepRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  stepBtnGhost: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  stepBtnSolid: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  stepGhostGlyph: { fontSize: 20, color: colors.text, fontFamily: fonts.black },
  stepSolidGlyph: { fontSize: 20, color: "#fff", fontFamily: fonts.black },
  totalRow: {
    backgroundColor: colors.pump,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: 13, fontFamily: fonts.black, color: "#3a7ba0" },
  totalValue: { fontSize: 19, fontFamily: fonts.black, color: colors.pumpIcon },
  submit: { marginTop: 20 },
  historyTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.text, marginTop: 18, marginBottom: 10 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  sessionDate: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted, marginBottom: 2 },
  sessionDetail: { fontSize: 14, fontFamily: fonts.semi, color: colors.text },
  sessionNotes: { fontSize: 12, fontFamily: fonts.medium, color: colors.muted, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.danger, paddingHorizontal: 8 },
});
