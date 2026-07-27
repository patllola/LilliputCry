import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChipRow } from "@/components/ChipRow";
import { DialGauge } from "@/components/DialGauge";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { Stepper } from "@/components/Stepper";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const PRESETS = [60, 90, 120, 150] as const;

export default function EditLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [milkPrepared, setMilkPrepared] = useState(0);
  const [milkFed, setMilkFed] = useState(0);
  const [notes, setNotes] = useState("");
  const [loadingLog, setLoadingLog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const log = await api.getLog(id);
        setMilkPrepared(log.milkPrepared);
        setMilkFed(log.milkFed);
        setNotes(log.notes ?? "");
      } catch {
        setError("Failed to load feeding log.");
      } finally {
        setLoadingLog(false);
      }
    })();
  }, [id]);

  function handlePreparedChange(next: number) {
    setMilkPrepared(next);
    setMilkFed((fed) => Math.min(fed, next));
  }

  async function handleSave() {
    if (milkPrepared <= 0) {
      setError("Milk prepared must be greater than 0.");
      return;
    }
    if (milkFed > milkPrepared) {
      setError("Milk fed cannot exceed milk prepared.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await api.updateLog(id, {
        milkPrepared,
        milkFed,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const waste = Math.max(0, milkPrepared - milkFed);
  const wastePct = milkPrepared > 0 ? Math.round((waste / milkPrepared) * 100) : 0;

  if (loadingLog) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScreenShell title="Edit Feeding">
      <Card>
        <Text style={styles.fieldLabel}>Milk prepared</Text>
        <Stepper value={milkPrepared} onChange={handlePreparedChange} step={10} max={400} unit="ml" />
        <View style={styles.chips}>
          <ChipRow options={PRESETS} value={milkPrepared as (typeof PRESETS)[number]} onChange={handlePreparedChange} format={(v) => `${v}ml`} />
        </View>

        <Text style={[styles.fieldLabel, styles.fedLabel]}>Milk fed</Text>
        <Stepper value={milkFed} onChange={setMilkFed} step={10} max={milkPrepared} unit="ml" />

        <View style={styles.wastePanel}>
          <DialGauge size={74} value={wastePct} suffix="%" color={colors.accent} trackColor={colors.line} />
          <View>
            <Text style={styles.wasteTitle}>Waste this feed</Text>
            <Text style={styles.wasteDetail}>{waste}ml left in bottle</Text>
          </View>
        </View>

        <FormField
          label="Notes (optional)"
          placeholder="Any observations..."
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {error && <Banner message={error} />}

        <Button title="Save changes" onPress={handleSave} loading={saving} style={styles.submit} />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  fieldLabel: { fontSize: 12.5, fontFamily: fonts.black, color: colors.text, marginBottom: 8 },
  fedLabel: { marginTop: 18 },
  chips: { marginTop: 10 },
  wastePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 14,
    marginTop: 18,
  },
  wasteTitle: { fontSize: 13, fontFamily: fonts.black, color: colors.text },
  wasteDetail: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted, marginTop: 1 },
  submit: { marginTop: 18 },
});
