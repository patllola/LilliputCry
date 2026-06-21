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
  route: string;
  adminOnly?: boolean;
};

const MENU: MenuItem[] = [
  { label: "Dashboard",     emoji: "📊", route: "/dashboard" },
  { label: "Baby Feed",     emoji: "🍼", route: "/log" },
  { label: "Milk Pump",     emoji: "🥛", route: "/milk-pump" },
  { label: "Sleep Track",   emoji: "😴", route: "/sleep" },
  { label: "Milestone",     emoji: "🌟", route: "/milestone" },
  { label: "Refer a Friend",emoji: "🎁", route: "/refer" },
  { label: "Profile",       emoji: "👤", route: "/profile" },
  { label: "Admin Panel",   emoji: "🛡️", route: "/admin", adminOnly: true },
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

  const isAdmin = user?.role === "Admin";

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
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>🛡️ Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.menu}>
        {MENU.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.item, item.adminOnly && styles.itemAdmin]}
            onPress={() => go(item.route)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <Text style={[styles.itemLabel, item.adminOnly && styles.itemLabelAdmin]}>
              {item.label}
            </Text>
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
      <Drawer.Screen name="(tabs)"     options={{ title: "Home" }} />
      <Drawer.Screen name="refer"      options={{ title: "Refer a Friend" }} />
      <Drawer.Screen name="milk-pump"  options={{ title: "Milk Pump" }} />
      <Drawer.Screen name="sleep"      options={{ title: "Sleep Track" }} />
      <Drawer.Screen name="milestone"  options={{ title: "Milestone" }} />
      <Drawer.Screen name="admin"      options={{ title: "Admin Panel" }} />
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
  adminBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#7c3aed",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  menu: { paddingTop: 12, paddingHorizontal: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemAdmin: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 4 },
  itemEmoji: { fontSize: 20, width: 32 },
  itemLabel: { fontSize: 15, fontWeight: "600", color: colors.label },
  itemLabelAdmin: { color: "#7c3aed" },
});
