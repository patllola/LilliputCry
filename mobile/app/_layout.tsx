import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getStoredToken } from "@/lib/auth";
import { configureGoogleSignIn } from "@/lib/google";
import { useAppFonts } from "@/theme/fonts";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    configureGoogleSignIn();
    setReady(true);
  }, []);

  if (!ready || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
