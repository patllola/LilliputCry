import { useState, useCallback } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "@/api";
import { getStoredUser, storeUser, clearAuth } from "@/lib/auth";
import type { UserProfile } from "@/types/user";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { Divider } from "@/components/Divider";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const [, setUser] = useState<UserProfile | null>(null);
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
    <ScreenContainer>
      <ScreenHeading title="Profile" subtitle="Update your account information" />

      <Card style={styles.card}>
        <FormField label="Full name" value={fullName} onChangeText={setFullName} />
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          label="Phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="e.g. +1 555 000 0000"
        />

        <Divider />
        <Text style={styles.sectionLabel}>Location</Text>

        <FormField label="Country" value={country} onChangeText={setCountry} placeholder="e.g. USA" />
        <FormField label="City" value={city} onChangeText={setCity} placeholder="e.g. New York" />
        <FormField label="Gender" value={gender} onChangeText={setGender} placeholder="e.g. Female" />

        {error && <Banner message={error} />}
        {saved && <Banner message="Profile saved!" variant="success" />}

        <Button title="Save Profile" onPress={handleSave} loading={loading} style={styles.submit} />
      </Card>

      <Button title="Log Out" variant="danger" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  submit: { marginTop: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
