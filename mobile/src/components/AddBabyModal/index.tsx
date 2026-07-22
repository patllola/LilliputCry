import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";

const AVATAR_COLORS = ["#ff6fa5", "#8b6fe0", "#4aa8e0", "#2fae8a", "#e0a92e", "#f07a4a"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type AddBabyModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export function AddBabyModal({ visible, onClose, onAdded }: AddBabyModalProps) {
  const { addBaby } = useBaby();
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [dob, setDob] = useState(todayIso());
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Baby's name is required.");
      return;
    }
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      setError("Enter date of birth as YYYY-MM-DD.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addBaby({
        name: name.trim(),
        avatarColor: color,
        dateOfBirth: parsedDob.toISOString(),
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      });
      setName("");
      setWeightKg("");
      setHeightCm("");
      onAdded?.();
      onClose();
    } catch {
      setError("Could not add baby. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Add a Baby</Text>

            <FormField label="Baby's name" placeholder="e.g. Ava" value={name} onChangeText={setName} />

            <Text style={styles.swatchLabel}>Avatar color</Text>
            <View style={styles.swatchRow}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    color === c && styles.swatchActive,
                  ]}
                />
              ))}
            </View>

            <FormField
              label="Date of birth (YYYY-MM-DD)"
              placeholder={todayIso()}
              value={dob}
              onChangeText={setDob}
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <FormField
                  label="Weight (kg)"
                  placeholder="3.4"
                  keyboardType="decimal-pad"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
              </View>
              <View style={styles.half}>
                <FormField
                  label="Height (cm)"
                  placeholder="50"
                  keyboardType="decimal-pad"
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
              </View>
            </View>

            {error && <Banner message={error} />}

            <Button title="Add Baby" onPress={handleSubmit} loading={loading} style={styles.submit} />
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={loading} style={styles.cancel} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 },
  swatchLabel: { fontSize: 13, fontWeight: "600", color: colors.label, marginBottom: 8, marginTop: 12 },
  swatchRow: { flexDirection: "row", gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 12 },
  swatchActive: { borderWidth: 3, borderColor: colors.text },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  submit: { marginTop: 20 },
  cancel: { marginTop: 10 },
});
