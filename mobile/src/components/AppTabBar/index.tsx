import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

/** 3-slot bar: Home / raised center FAB (always opens Log a Feed) / Profile. */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  function goTab(routeName: string) {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  }

  return (
    <View style={[s.bar, { paddingBottom: Math.max(24, insets.bottom + 10) }]}>
      <Pressable style={s.slot} onPress={() => goTab("home")}>
        <Feather name="home" size={20} color={activeName === "home" ? colors.accent : colors.muted} />
        <Text style={[s.label, { color: activeName === "home" ? colors.accent : colors.muted }]}>Home</Text>
      </Pressable>

      <Pressable style={s.fab} onPress={() => router.push("/log")}>
        <Feather name="plus" size={26} color="#fff" />
      </Pressable>

      <Pressable style={s.slot} onPress={() => goTab("profile")}>
        <Feather name="user" size={20} color={activeName === "profile" ? colors.accent : colors.muted} />
        <Text style={[s.label, { color: activeName === "profile" ? colors.accent : colors.muted }]}>Profile</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  slot: { flex: 1, alignItems: "center", gap: 3 },
  label: { fontSize: 10, fontFamily: fonts.black },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.accent,
    marginTop: -26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 6,
  },
});
