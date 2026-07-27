import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { api } from "@/api";
import { clearAuth } from "@/lib/auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { AdminStats, AdminUser } from "@/types/admin";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

type Filter = "all" | "paid" | "trial" | "expired" | "admin";

function statusMeta(user: AdminUser): { label: string; color: string } {
  if (user.role === "Admin") return { label: "ADMIN", color: colors.admin };
  if (user.hasActiveAccess && user.subscriptionStatus === "Active") return { label: "PAID", color: colors.success };
  if (user.hasActiveAccess && user.subscriptionStatus === "Trial") return { label: "TRIAL", color: colors.trial };
  return { label: "EXPIRED", color: colors.danger };
}

function matchesFilter(user: AdminUser, filter: Filter): boolean {
  if (filter === "all") return true;
  const meta = statusMeta(user);
  return meta.label.toLowerCase() === filter;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All accounts" },
  { id: "paid", label: "Paid" },
  { id: "trial", label: "Trial" },
  { id: "expired", label: "Expired" },
  { id: "admin", label: "Admin" },
];

export default function AdminScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const [s, u] = await Promise.all([api.getAdminStats(), api.getAdminUsers()]);
      setStats(s);
      setUsers(u);
    } catch {
      // ignore — keep last-known data on screen
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  async function handleActivate(user: AdminUser) {
    Alert.alert("Activate Subscription", `Activate 1 month for ${user.fullName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Activate",
        onPress: async () => {
          setActionLoading(user.guidId);
          try {
            await api.activateSubscription(user.guidId, 1);
            await load();
          } catch {
            Alert.alert("Error", "Failed to activate. Try again.");
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  async function handleRevoke(user: AdminUser) {
    Alert.alert("Revoke Access", `Revoke subscription for ${user.fullName}? They will lose access immediately.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: async () => {
          setActionLoading(user.guidId);
          try {
            await api.revokeSubscription(user.guidId);
            await load();
          } catch {
            Alert.alert("Error", "Failed to revoke. Try again.");
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const rows = users.filter((u) => matchesFilter(u, filter));

  const header = (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerChip}>
            <Feather name="shield" size={20} color={colors.planIcon} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin</Text>
            <Text style={styles.headerSubtitle}>Subscribers & revenue</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.mrrHero}>
          <Text style={styles.mrrLabel}>MONTHLY RECURRING REVENUE</Text>
          <Text style={styles.mrrValue}>${stats.estimatedMonthlyRevenue.toFixed(0)}</Text>
          <View style={styles.mrrStats}>
            <View style={styles.mrrStat}>
              <Text style={styles.mrrStatLabel} numberOfLines={1}>Paid</Text>
              <Text style={styles.mrrStatValue}>{stats.activePaidUsers}</Text>
            </View>
            <View style={styles.mrrStat}>
              <Text style={styles.mrrStatLabel} numberOfLines={1}>Trial</Text>
              <Text style={styles.mrrStatValue}>{stats.activeTrialUsers}</Text>
            </View>
            <View style={styles.mrrStat}>
              <Text style={styles.mrrStatLabel} numberOfLines={1}>Expired</Text>
              <Text style={styles.mrrStatValue}>{stats.expiredTrialUsers + stats.expiredPaidUsers}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, active ? styles.filterChipOn : styles.filterChipOff]}
            >
              <Text style={[styles.filterLabel, active ? styles.filterLabelOn : styles.filterLabelOff]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.subsHeaderRow}>
        <Text style={styles.sectionTitle}>{filter === "all" ? "All accounts" : FILTERS.find((f) => f.id === filter)?.label}</Text>
        <Text style={styles.subsTotal}>{rows.length} {rows.length === 1 ? "account" : "accounts"}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(u) => u.guidId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.emptyText}>No accounts match this filter.</Text>}
        renderItem={({ item }) => {
          const expanded = expandedId === item.guidId;
          const isAdmin = item.role === "Admin";
          const meta = statusMeta(item);
          return (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => setExpandedId(expanded ? null : item.guidId)}
              activeOpacity={0.85}
            >
              <View style={styles.userRow}>
                <View style={[styles.userAvatar, { backgroundColor: meta.color }]}>
                  <Text style={styles.userAvatarText}>{item.fullName[0]?.toUpperCase() ?? "?"}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${meta.color}22` }]}>
                  <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>

              {expanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined</Text>
                    <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
                  </View>
                  {!isAdmin && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trial ends</Text>
                        <Text style={styles.detailValue}>{formatDate(item.trialEndsAt)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Subscription expires</Text>
                        <Text style={styles.detailValue}>{formatDate(item.subscriptionExpiresAt)}</Text>
                      </View>
                      <View style={styles.actionRow}>
                        {actionLoading === item.guidId ? (
                          <ActivityIndicator color={colors.accent} />
                        ) : (
                          <>
                            <TouchableOpacity style={[styles.actionBtn, styles.activateBtn]} onPress={() => handleActivate(item)}>
                              <Text style={styles.activateBtnText}>✓ Activate 1 Month</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.revokeBtn]} onPress={() => handleRevoke(item)}>
                              <Text style={styles.revokeBtnText}>✕ Revoke</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerIdentity: { flexDirection: "row", alignItems: "center", gap: 11 },
  headerChip: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.plan, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: fonts.black, color: colors.text },
  headerSubtitle: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted },
  logoutBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12 },
  logoutText: { fontSize: 11.5, fontFamily: fonts.black, color: colors.muted },

  mrrHero: { borderRadius: 26, padding: 18, backgroundColor: colors.planIcon, marginBottom: 14 },
  mrrLabel: { fontSize: 11.5, fontFamily: fonts.black, color: "rgba(255,255,255,.9)" },
  mrrValue: { fontSize: 32, fontFamily: fonts.black, color: "#fff", marginTop: 3 },
  mrrStats: { flexDirection: "row", gap: 10, marginTop: 14 },
  mrrStat: { flex: 1, backgroundColor: "rgba(255,255,255,.16)", borderRadius: 14, paddingVertical: 9, paddingHorizontal: 11 },
  mrrStatLabel: { fontSize: 10.5, fontFamily: fonts.bold, color: "rgba(255,255,255,.85)" },
  mrrStatValue: { fontSize: 15, fontFamily: fonts.black, color: "#fff" },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 22, borderWidth: 1.5 },
  filterChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterChipOff: { backgroundColor: "transparent", borderColor: colors.line },
  filterLabel: { fontSize: 12, fontFamily: fonts.black },
  filterLabelOn: { color: "#fff" },
  filterLabelOff: { color: colors.text },

  subsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  subsTotal: { fontSize: 11.5, fontFamily: fonts.black, color: colors.muted },
  emptyText: { textAlign: "center", padding: 26, fontSize: 12.5, fontFamily: fonts.bold, color: colors.muted },

  userCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, marginBottom: 10, overflow: "hidden" },
  userRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 11 },
  userAvatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 16, fontFamily: fonts.black, color: "#fff" },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13.5, fontFamily: fonts.black, color: colors.text },
  userEmail: { fontSize: 10.5, fontFamily: fonts.bold, color: colors.muted },
  statusPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 9 },
  statusPillText: { fontSize: 9.5, fontFamily: fonts.black },

  expandedSection: { borderTopWidth: 1.5, borderTopColor: colors.line, padding: 12, gap: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 12.5, fontFamily: fonts.semi, color: colors.muted },
  detailValue: { fontSize: 12.5, fontFamily: fonts.black, color: colors.text },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 9, alignItems: "center" },
  activateBtn: { backgroundColor: colors.accent },
  activateBtnText: { color: "#fff", fontFamily: fonts.black, fontSize: 12.5 },
  revokeBtn: { backgroundColor: colors.dangerBg, borderWidth: 1.5, borderColor: colors.dangerLine },
  revokeBtnText: { color: colors.danger, fontFamily: fonts.black, fontSize: 12.5 },
});
