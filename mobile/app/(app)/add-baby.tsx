import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const AVATAR_COLORS = ["#ff6fa5", "#8b6fe0", "#4aa8e0", "#2fae8a", "#e0a92e", "#f07a4a"];

export default function AddBabyScreen() {
  const router = useRouter();
  const { addBaby } = useBaby();
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [dob, setDob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Baby's name is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addBaby({
        name: name.trim(),
        avatarColor: color,
        dateOfBirth: dob.toISOString(),
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      });
      router.replace({ pathname: "/(app)/(tabs)/home", params: { celebrate: "1" } });
    } catch {
      setError("Could not add baby. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell title="Add a Baby">
      <Card>
        <FormField label="Baby's name" placeholder="e.g. Ava" value={name} onChangeText={setName} />

        <Text style={styles.swatchLabel}>Avatar color</Text>
        <View style={styles.swatchRow}>
          {AVATAR_COLORS.map((c) => {
            const active = color === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatchWrap, active && { borderColor: c }]}
              >
                <View style={[styles.swatch, { backgroundColor: c }, active && styles.swatchActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.swatchLabel}>Date of birth</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>
            {dob.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(_event, selected) => {
              setShowPicker(Platform.OS === "ios");
              if (selected) setDob(selected);
            }}
          />
        )}

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
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  swatchLabel: { fontSize: 12.5, fontFamily: fonts.black, color: colors.text, marginBottom: 8, marginTop: 14 },
  swatchRow: { flexDirection: "row", gap: 10 },
  swatchWrap: { padding: 3, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  swatch: { width: 38, height: 38, borderRadius: 13 },
  swatchActive: { borderWidth: 3, borderColor: "#fff" },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  dateLabel: { fontSize: 13, fontFamily: fonts.black, color: colors.muted },
  dateValue: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  submit: { marginTop: 18 },
});
