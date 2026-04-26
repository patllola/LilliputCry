import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/api";
import { getStoredUser, storeUser, clearAuth } from "@/lib/auth";
import type { UserProfile } from "@/types/user";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
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
          setCountry(u.country ?? "");
          setCity(u.city ?? "");
          setGender(u.gender ?? "");
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
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        gender: gender.trim() || undefined,
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Update your account information</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="e.g. +1 555 000 0000"
            placeholderTextColor="#9ca3af"
          />

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Location</Text>

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. USA"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. New York"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={setGender}
            placeholder="e.g. Female"
            placeholderTextColor="#9ca3af"
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {saved && <Text style={styles.success}>Profile saved!</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8 },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 10,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8,
  },
  success: {
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
  logoutButton: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
