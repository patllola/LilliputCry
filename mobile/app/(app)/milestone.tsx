import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { api } from "@/api";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ChipRow } from "@/components/ChipRow";
import { FormField } from "@/components/FormField";
import { ScreenShell } from "@/components/ScreenShell";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Milestone } from "@/types/milestone";

const NOTE_PRESETS = ["First smile", "First laugh", "Rolled over", "First steps", "First tooth"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
}

function formatDateLabel(d: Date) {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `Today · ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function MilestoneScreen() {
  const { activeBaby } = useBaby();
  const [note, setNote] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [achievedAt, setAchievedAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => { loadMilestones(); }, [activeBaby?.guidId]);

  async function loadMilestones() {
    setListLoading(true);
    try { setMilestones(await api.getMilestones(activeBaby?.guidId)); } catch {}
    finally { setListLoading(false); }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission to access photos is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageMime(asset.mimeType ?? "image/jpeg");
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!note.trim()) { setError("Achievement note is required."); return; }
    if (!imageUri) { setError("Please pick a photo."); return; }

    setError(null);
    setLoading(true);
    try {
      await api.createMilestone(
        note.trim(),
        achievedAt.toISOString(),
        imageUri,
        imageMime,
        activeBaby?.guidId
      );
      setSuccess(true);
      setNote(""); setImageUri(null);
      await loadMilestones();
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to upload. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMilestone(id);
      setMilestones(m => m.filter(x => x.guidId !== id));
    } catch {}
  }

  return (
    <ScreenShell title="Milestones">
      <Card style={styles.card}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="camera" size={30} color="#e178a8" />
              <Text style={styles.imagePlaceholderText}>Tap to add a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <FormField
          label="What happened?"
          placeholder="e.g. First smile"
          multiline
          numberOfLines={3}
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.chipSpacer}>
          <ChipRow options={NOTE_PRESETS} value={note} onChange={setNote} />
        </View>

        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>{formatDateLabel(achievedAt)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={achievedAt}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={new Date()}
            onChange={(_event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setAchievedAt(selectedDate);
            }}
          />
        )}

        {error && <Banner message={error} />}
        {success && <Banner message="Milestone saved! 🎉" variant="success" />}

        <Button
          title={success ? "Saved! 🎉" : "Save Milestone"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submit}
        />
      </Card>

      <Text style={styles.galleryTitle}>Memory Gallery</Text>

      {listLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
      ) : milestones.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌟</Text>
          <Text style={styles.emptyText}>No milestones yet. Add your first one above!</Text>
        </View>
      ) : (
        <FlatList
          data={milestones}
          keyExtractor={i => i.guidId}
          scrollEnabled={false}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridNote} numberOfLines={2}>{item.note}</Text>
                <Text style={styles.gridDate}>{formatDate(item.achievedAt)}</Text>
              </View>
              <TouchableOpacity
                style={styles.gridDelete}
                onPress={() => handleDelete(item.guidId)}
              >
                <Text style={styles.gridDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
  imagePicker: { marginBottom: 16, borderRadius: 18, overflow: "hidden" },
  imagePlaceholder: {
    height: 150,
    backgroundColor: "#fff2f8",
    borderWidth: 2,
    borderColor: "#f0b8d3",
    borderStyle: "dashed",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 13, fontFamily: fonts.black, color: "#e178a8" },
  previewImage: { width: "100%", height: 200, borderRadius: 18 },
  chipSpacer: { marginTop: 12 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  dateLabel: { fontSize: 13, fontFamily: fonts.black, color: colors.muted },
  dateValue: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  submit: { marginTop: 16 },
  galleryTitle: { fontSize: 16, fontFamily: fonts.black, color: colors.text, marginBottom: 12 },
  gridRow: { gap: 10, marginBottom: 10 },
  gridItem: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  gridImage: { width: "100%", height: 160 },
  gridOverlay: { padding: 8 },
  gridNote: { fontSize: 13, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  gridDate: { fontSize: 11, fontFamily: fonts.semi, color: colors.muted },
  gridDelete: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  gridDeleteText: { color: "#fff", fontSize: 12, fontFamily: fonts.bold },
  empty: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: fonts.semi, color: colors.muted, textAlign: "center" },
});
