import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/api";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { colors } from "@/theme/colors";

export default function EditLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [milkPrepared, setMilkPrepared] = useState("");
  const [milkFed, setMilkFed] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingLog, setLoadingLog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const log = await api.getLog(id);
        setMilkPrepared(String(log.milkPrepared));
        setMilkFed(String(log.milkFed));
        setNotes(log.notes ?? "");
      } catch {
        setError("Failed to load feeding log.");
      } finally {
        setLoadingLog(false);
      }
    })();
  }, [id]);

  async function handleSave() {
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
    setSaving(true);
    try {
      await api.updateLog(id, {
        milkPrepared: prepared,
        milkFed: fed,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingLog) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScreenHeading title="Edit Feeding" subtitle="Update milk prepared and fed for this session" />

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

        <Button title="Save changes" onPress={handleSave} loading={saving} style={styles.submit} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  header: { marginBottom: 16 },
  backLink: { fontSize: 15, color: colors.brand, fontWeight: "600" },
  card: { marginBottom: 16 },
  submit: { marginTop: 20 },
});
