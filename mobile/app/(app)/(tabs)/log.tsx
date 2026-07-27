import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "@/api";
import { ScreenShell } from "@/components/ScreenShell";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { Stepper } from "@/components/Stepper";
import { ChipRow } from "@/components/ChipRow";
import { DialGauge } from "@/components/DialGauge";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const PREPARED_PRESETS = [60, 90, 120, 150] as const;

export default function LogScreen() {
  const { activeBaby } = useBaby();
  const [milkPrepared, setMilkPrepared] = useState(0);
  const [milkFed, setMilkFed] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePrepared(next: number) {
    setMilkPrepared(next);
    if (milkFed > next) setMilkFed(next);
  }

  async function handleSubmit() {
    if (milkPrepared <= 0) {
      setError("Milk prepared must be greater than 0.");
      return;
    }
    if (milkFed < 0) {
      setError("Milk fed cannot be negative.");
      return;
    }
    if (milkFed > milkPrepared) {
      setError("Milk fed cannot exceed milk prepared.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.createLog({
        fedAt: new Date().toISOString(),
        milkPrepared,
        milkFed,
        notes: notes.trim() || undefined,
        babyId: activeBaby?.guidId,
      });
      setSuccess(true);
      setMilkPrepared(0);
      setMilkFed(0);
      setNotes("");
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const waste = Math.max(0, milkPrepared - milkFed);
  const wastePct = milkPrepared > 0 ? Math.round((waste / milkPrepared) * 100) : 0;

  return (
    <ScreenShell title="Log a Feed">
      <Card>
        <Text style={styles.fieldLabel}>Milk prepared</Text>
        <Stepper value={milkPrepared} onChange={updatePrepared} step={10} max={400} unit="ml" />
        <View style={styles.presetSpacing}>
          <ChipRow
            options={PREPARED_PRESETS}
            value={milkPrepared as (typeof PREPARED_PRESETS)[number]}
            onChange={updatePrepared}
            format={(v) => `${v}ml`}
          />
        </View>

        <Text style={styles.fieldLabel}>Milk fed</Text>
        <Stepper value={milkFed} onChange={setMilkFed} step={10} max={milkPrepared} unit="ml" />

        <View style={styles.wastePanel}>
          <DialGauge size={74} value={wastePct} suffix="%" color={colors.accent} trackColor={colors.line} />
          <View>
            <Text style={styles.wasteTitle}>Waste this feed</Text>
            <Text style={styles.wasteSubtitle}>{waste}ml left in bottle</Text>
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
        {success && <Banner message="Feeding logged successfully!" variant="success" />}

        <Button
          title={success ? "Saved!" : "Log Feeding"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submit}
        />
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontFamily: fonts.black, color: colors.text, marginBottom: 8, marginTop: 14 },
  presetSpacing: { marginTop: 12 },
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
  wasteSubtitle: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  submit: { marginTop: 20 },
});
