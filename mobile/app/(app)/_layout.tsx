import { useCallback, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { useFocusEffect, useRouter } from "expo-router";
import { getStoredUser } from "@/lib/auth";
import type { UserProfile } from "@/types/user";
import { colors } from "@/theme/colors";

type MenuItem = {
  label: string;
  emoji: string;
  /** Route to navigate to. Tab routes (/dashboard, /log, /profile) live inside the (tabs) group. */
  route: string;
};

const MENU: MenuItem[] = [
  { label: "Dashboard", emoji: "📊", route: "/dashboard" },
  { label: "Refer a Friend", emoji: "🎁", route: "/refer" },
  { label: "Milk Pump", emoji: "🥛", route: "/milk-pump" },
  { label: "Baby Feed", emoji: "🍼", route: "/log" },
  { label: "Sleep Track", emoji: "😴", route: "/sleep" },
  { label: "Milestone", emoji: "🌟", route: "/milestone" },
  { label: "Profile", emoji: "👤", route: "/profile" },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      getStoredUser().then(setUser);
    }, [])
  );

  function go(route: string) {
    props.navigation.closeDrawer();
    router.push(route as never);
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        {user?.profilePictureUrl ? (
          <Image source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {(user?.fullName?.[0] ?? "🍼").toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.fullName ?? "LilliputCry"}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.menu}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => go(item.route)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "Home" }} />
      <Drawer.Screen name="refer" options={{ title: "Refer a Friend" }} />
      <Drawer.Screen name="milk-pump" options={{ title: "Milk Pump" }} />
      <Drawer.Screen name="sleep" options={{ title: "Sleep Track" }} />
      <Drawer.Screen name="milestone" options={{ title: "Milestone" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 0 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.brandTint,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 12 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 24, fontWeight: "700", color: "#fff" },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  menu: { paddingTop: 12, paddingHorizontal: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemEmoji: { fontSize: 20, width: 32 },
  itemLabel: { fontSize: 15, fontWeight: "600", color: colors.label },
});
