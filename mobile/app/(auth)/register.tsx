import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter, Link } from "expo-router";
import { api } from "@/api";
import { storeUser, storeToken } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/google";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { Divider } from "@/components/Divider";
import { colors } from "@/theme/colors";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    if (!agreed) { setError("Please accept the Terms of Service and Privacy Policy."); return; }
    setError(null);
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) { setGoogleLoading(false); return; }
      const res = await api.googleSignIn(idToken);
      await storeUser(res.user);
      if (res.token) await storeToken(res.token);
      router.replace("/(app)/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleRegister() {
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        email,
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await storeUser(res.user);
      if (res.token) await storeToken(res.token);
      router.replace("/(app)/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email_already_exists")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("user_already_exists")) {
        setError("An account with this name and phone number already exists.");
      } else {
        setError("Registration failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer centered>
      <ScreenHeading emoji="🍼" title="Create your account" subtitle="Start tracking with LilliputCry" />

      <Card style={styles.card}>
        <FormField
          label="Full name *"
          placeholder="e.g. Sarah Johnson"
          value={fullName}
          onChangeText={setFullName}
        />
        <FormField
          label="Email *"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password *"
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <FormField
          label="Phone number (optional)"
          placeholder="e.g. +1 555 000 0000"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        {/* Terms & Privacy checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreed(a => !a)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>
            I agree to the{" "}
            <Text
              style={styles.checkLink}
              onPress={() => router.push("/terms")}
            >
              Terms of Service
            </Text>
            {" "}and{" "}
            <Text
              style={styles.checkLink}
              onPress={() => router.push("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>

        {error && <Banner message={error} />}

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          disabled={googleLoading}
          style={styles.submit}
        />

        <Divider label="or" />

        <Button
          title="Continue with Google"
          variant="secondary"
          onPress={handleGoogle}
          loading={googleLoading}
          disabled={loading}
        />
      </Card>

      <Text style={styles.footer}>
        Already have an account?{" "}
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
  submit: { marginTop: 8 },
  footer: { textAlign: "center", color: colors.textMuted, fontSize: 14 },
  link: { color: colors.brand, fontWeight: "600" },

  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16, marginBottom: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  checkLabel: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  checkLink: { color: colors.brand, fontWeight: "600" },
});
