import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/api";

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
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Edit Feeding</Text>
        <Text style={styles.subtitle}>Update milk prepared and fed for this session</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Milk prepared (ml) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 120"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            value={milkPrepared}
            onChangeText={setMilkPrepared}
          />

          <Text style={styles.label}>Milk fed (ml) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 100"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            value={milkFed}
            onChangeText={setMilkFed}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Any observations..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
  header: { marginBottom: 16 },
  backLink: { fontSize: 15, color: "#9333ea", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    elevation: 2,
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textarea: { height: 80, textAlignVertical: "top" },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 10,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#9333ea",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
