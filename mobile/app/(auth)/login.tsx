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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      await storeUser(res.user);
      if (res.token) await storeToken(res.token);
      router.replace("/(app)/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <ScreenContainer centered>
      <ScreenHeading emoji="🍼" title="Welcome back" subtitle="Sign in to LilliputCry" />

      <Card style={styles.card}>
        <FormField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Banner message={error} />}

        <Button
          title="Sign In"
          onPress={handleLogin}
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
        Don&apos;t have an account?{" "}
        <Link href="/(auth)/register" style={styles.link}>
          Create one
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
