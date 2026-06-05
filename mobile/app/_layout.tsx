import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getStoredToken } from "@/lib/auth";
import { configureGoogleSignIn } from "@/lib/google";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
