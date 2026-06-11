import { useState } from "react";
import { StyleSheet, Text } from "react-native";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) {
        setGoogleLoading(false);
        return;
      }
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
  submit: { marginTop: 20 },
  footer: { textAlign: "center", color: colors.textMuted, fontSize: 14 },
  link: { color: colors.brand, fontWeight: "600" },
});
