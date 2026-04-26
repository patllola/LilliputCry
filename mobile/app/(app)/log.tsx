import { useState } from "react";
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
  Alert,
} from "react-native";
import { api } from "@/api";

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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log a Feeding</Text>
        <Text style={styles.subtitle}>Record milk prepared and fed for this session</Text>

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

          {success && (
            <Text style={styles.successMsg}>Feeding logged successfully!</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {success ? "Saved!" : "Log Feeding"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Waste preview */}
        {milkPrepared && milkFed && !isNaN(parseFloat(milkPrepared)) && !isNaN(parseFloat(milkFed)) && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Text style={styles.previewText}>
              Waste:{" "}
              {Math.max(0, parseFloat(milkPrepared) - parseFloat(milkFed)).toFixed(1)}ml (
              {parseFloat(milkPrepared) > 0
                ? Math.round(
                    (Math.max(0, parseFloat(milkPrepared) - parseFloat(milkFed)) /
                      parseFloat(milkPrepared)) *
                      100
                  )
                : 0}
              %)
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 20, paddingTop: 60 },
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
  successMsg: {
    color: "#16a34a",
    fontSize: 13,
    marginTop: 10,
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "600",
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
  preview: {
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  previewTitle: { fontSize: 12, fontWeight: "700", color: "#7e22ce", marginBottom: 4 },
  previewText: { fontSize: 14, color: "#6b21a8" },
});
