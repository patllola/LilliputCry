import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
import type { Milestone } from "@/types/milestone";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
}

export default function MilestoneScreen() {
  const { activeBaby } = useBaby();
  const [note, setNote] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
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
        new Date().toISOString(),
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
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        <ScreenHeading title="Milestones" subtitle="Capture and celebrate your baby's firsts" />

        <Card style={styles.card}>
          {/* Image picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>Tap to pick a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <FormField
            label="Achievement note *"
            placeholder="e.g. First smile, First steps..."
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />

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
          <ActivityIndicator color={colors.brand} style={{ marginTop: 20 }} />
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
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 20, paddingTop: 88 },
  card: { marginBottom: 20 },
  imagePicker: { marginBottom: 16, borderRadius: 12, overflow: "hidden" },
  imagePlaceholder: {
    height: 160,
    backgroundColor: colors.brandTint,
    borderWidth: 2,
    borderColor: colors.brandBorder,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { fontSize: 14, color: colors.brandText, fontWeight: "600" },
  previewImage: { width: "100%", height: 200, borderRadius: 12 },
  submit: { marginTop: 8 },
  galleryTitle: { fontSize: 16, fontWeight: "700", color: colors.label, marginBottom: 12 },
  gridRow: { gap: 10, marginBottom: 10 },
  gridItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridImage: { width: "100%", height: 160 },
  gridOverlay: { padding: 8 },
  gridNote: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 2 },
  gridDate: { fontSize: 11, color: colors.textMuted },
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
  gridDeleteText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
