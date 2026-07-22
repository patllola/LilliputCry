import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import type { PumpSession } from "@/types/pump";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MilkPumpScreen() {
  const { activeBaby } = useBaby();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessions, setSessions] = useState<PumpSession[]>([]);

  useEffect(() => { loadSessions(); }, [activeBaby?.guidId]);

  async function loadSessions() {
    try { setSessions(await api.getPumpSessions(activeBaby?.guidId)); } catch {}
  }

  async function handleSubmit() {
    const l = parseFloat(left);
    const r = parseFloat(right);
    if (isNaN(l) || l < 0) { setError("Left amount cannot be negative."); return; }
    if (isNaN(r) || r < 0) { setError("Right amount cannot be negative."); return; }
    if ((isNaN(l) || l === 0) && (isNaN(r) || r === 0)) {
      setError("At least one side must be greater than 0."); return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.createPumpSession({
        pumpedAt: new Date().toISOString(),
        leftAmount: isNaN(l) ? 0 : l,
        rightAmount: isNaN(r) ? 0 : r,
        notes: notes.trim() || undefined,
        babyId: activeBaby?.guidId,
      });
      setSuccess(true);
      setLeft(""); setRight(""); setNotes("");
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

  const leftVal = parseFloat(left) || 0;
  const rightVal = parseFloat(right) || 0;
  const total = leftVal + rightVal;

  return (
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        <ScreenHeading title="Milk Pump" subtitle="Log left and right breast output" />

        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.half}>
              <FormField
                label="Left (ml)"
                placeholder="0"
                keyboardType="decimal-pad"
                value={left}
                onChangeText={setLeft}
              />
            </View>
            <View style={styles.half}>
              <FormField
                label="Right (ml)"
                placeholder="0"
                keyboardType="decimal-pad"
                value={right}
                onChangeText={setRight}
              />
            </View>
          </View>

          <FormField
            label="Notes (optional)"
            placeholder="Any observations..."
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />

          {total > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total.toFixed(1)} ml</Text>
            </View>
          )}

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
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  card: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  totalBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.brandTint,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  totalLabel: { fontSize: 13, fontWeight: "600", color: colors.brandText },
  totalValue: { fontSize: 15, fontWeight: "700", color: colors.brand },
  submit: { marginTop: 8 },
  historyTitle: { fontSize: 14, fontWeight: "700", color: colors.label, marginBottom: 10 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionDate: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  sessionDetail: { fontSize: 14, fontWeight: "600", color: colors.text },
  sessionNotes: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  deleteBtn: { fontSize: 16, color: colors.danger, paddingHorizontal: 8 },
});
