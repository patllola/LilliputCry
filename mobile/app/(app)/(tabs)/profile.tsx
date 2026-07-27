import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/api";
import { getStoredUser, storeUser, clearAuth } from "@/lib/auth";
import { useBaby } from "@/lib/babyContext";
import { listCaregivers, ROLE_LABELS } from "@/lib/mockCaregivers";
import type { UserProfile } from "@/types/user";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function ProfileScreen() {
  const router = useRouter();
  const { activeBaby } = useBaby();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getStoredUser().then((u) => {
        if (u) {
          setUser(u);
          setFullName(u.fullName);
          setEmail(u.email);
          setPhoneNumber(u.phoneNumber ?? "");
        }
      });
    }, [])
  );

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      const updated = await api.updateProfile({
        fullName,
        email,
        phoneNumber: phoneNumber.trim() || undefined,
        country: user?.country ?? undefined,
        city: user?.city ?? undefined,
        gender: user?.gender ?? undefined,
      });
      await storeUser(updated);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email_already_exists")) {
        setError("This email is already in use.");
      } else {
        setError("Failed to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const caregivers = listCaregivers();

  return (
    <View style={styles.screen}>
      <ScreenContainer contentContainerStyle={styles.scrollPad}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.fullName?.[0] ?? "?").toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName ?? "—"}</Text>
          <Text style={styles.email}>{user?.email ?? ""}</Text>
        </View>

        <Card style={styles.card}>
          <FormField label="Full name" value={fullName} onChangeText={setFullName} />
          <FormField
            label="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="e.g. +1 555 000 0000"
          />

          {error && <Banner message={error} />}
          {saved && <Banner message="Profile saved!" variant="success" />}

          <Button title="Save Profile" onPress={handleSave} loading={loading} style={styles.submit} />
        </Card>

        <View style={styles.caregiversHeader}>
          <Text style={styles.sectionTitle}>Caregivers</Text>
          <Text style={styles.inviteLink} onPress={() => router.push("/invite-caregiver")}>
            + Invite
          </Text>
        </View>
        <Text style={styles.caregiversExplainer}>
          People who can track {activeBaby?.name ?? "your baby"} with you. Each uses their own login.
        </Text>
        <View style={{ gap: 10, marginBottom: 16 }}>
          {caregivers.map((c) => (
            <View key={c.id} style={styles.caregiverRow}>
              <View style={[styles.caregiverAvatar, { backgroundColor: c.color }]}>
                <Text style={styles.caregiverAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.caregiverName}>{c.name}</Text>
                <Text style={styles.caregiverEmail}>{c.email}</Text>
              </View>
              <View style={[styles.rolePill, c.role === "owner" ? styles.rolePillOwner : styles.rolePillOther]}>
                <Text style={[styles.roleText, c.role === "owner" ? styles.roleTextOwner : styles.roleTextOther]}>
                  {ROLE_LABELS[c.role]}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button title="Log Out" variant="danger" onPress={handleLogout} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: 18, paddingTop: 60, paddingBottom: 32 },
  hero: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: colors.heroFrom,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontFamily: fonts.black, color: "#fff" },
  name: { fontSize: 18, fontFamily: fonts.black, color: colors.text, marginTop: 8 },
  email: { fontSize: 12.5, fontFamily: fonts.bold, color: colors.muted },
  card: { marginBottom: 22 },
  submit: { marginTop: 18 },
  caregiversHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  inviteLink: { fontSize: 12.5, fontFamily: fonts.black, color: colors.accent },
  caregiversExplainer: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted, lineHeight: 16.5, marginBottom: 14 },
  caregiverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 11,
  },
  caregiverAvatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  caregiverAvatarText: { fontSize: 16, fontFamily: fonts.black, color: "#fff" },
  caregiverName: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  caregiverEmail: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },
  rolePill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 10 },
  rolePillOwner: { backgroundColor: colors.accentSoft },
  rolePillOther: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.line },
  roleText: { fontSize: 10, fontFamily: fonts.black },
  roleTextOwner: { color: "#6b4fa8" },
  roleTextOther: { color: colors.muted },
});
