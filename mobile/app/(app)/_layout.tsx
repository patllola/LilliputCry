import { Stack } from "expo-router";
import { BabyProvider } from "@/lib/babyContext";

export default function AppLayout() {
  return (
    <BabyProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sleep" />
        <Stack.Screen name="milk-pump" />
        <Stack.Screen name="medications" />
        <Stack.Screen name="milestone" />
        <Stack.Screen name="refer" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="add-baby" />
        <Stack.Screen name="payment-plan" />
        <Stack.Screen name="invite-caregiver" />
        <Stack.Screen name="history" />
        <Stack.Screen name="edit-log/[id]" />
      </Stack>
    </BabyProvider>
  );
}
