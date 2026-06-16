import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "@/api";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { MenuButton } from "@/components/MenuButton";
import { colors } from "@/theme/colors";

export default function LogScreen() {
  const [milkPrepared, setMilkPrepared] = useState("");
  const [milkFed, setMilkFed] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const prepared = parseFloat(milkPrepared);
    const fed = parseFloat(milkFed);

    if (isNaN(prepared) || prepared <= 0) {
      setError("Milk prepared must be greater than 0.");
      return;
    }
    if (isNaN(fed) || fed < 0) {
      setError("Milk fed cannot be negative.");
      return;
    }
    if (fed > prepared) {
      setError("Milk fed cannot exceed milk prepared.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.createLog({
        fedAt: new Date().toISOString(),
        milkPrepared: prepared,
        milkFed: fed,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setMilkPrepared("");
      setMilkFed("");
      setNotes("");
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showPreview =
    milkPrepared !== "" &&
    milkFed !== "" &&
    !isNaN(parseFloat(milkPrepared)) &&
    !isNaN(parseFloat(milkFed));
  const prepared = parseFloat(milkPrepared);
  const fed = parseFloat(milkFed);
  const waste = Math.max(0, prepared - fed);
  const wastePct = prepared > 0 ? Math.round((waste / prepared) * 100) : 0;

  return (
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
      <ScreenHeading title="Log a Feeding" subtitle="Record milk prepared and fed for this session" />

      <Card style={styles.card}>
        <FormField
          label="Milk prepared (ml) *"
          placeholder="e.g. 120"
          keyboardType="decimal-pad"
          value={milkPrepared}
          onChangeText={setMilkPrepared}
        />
        <FormField
          label="Milk fed (ml) *"
          placeholder="e.g. 100"
          keyboardType="decimal-pad"
          value={milkFed}
          onChangeText={setMilkFed}
        />
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

      {showPreview && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            Waste: {waste.toFixed(1)}ml ({wastePct}%)
          </Text>
        </View>
      )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  card: { marginBottom: 16 },
  submit: { marginTop: 20 },
  preview: {
    backgroundColor: colors.brandTint,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  previewTitle: { fontSize: 12, fontWeight: "700", color: colors.brandDark, marginBottom: 4 },
  previewText: { fontSize: 14, color: colors.brandText },
});
