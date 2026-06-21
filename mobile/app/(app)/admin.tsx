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
import { useFocusEffect } from "expo-router";
import { api } from "@/api";
import { MenuButton } from "@/components/MenuButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeading } from "@/components/ScreenHeading";
import { colors } from "@/theme/colors";
import type { AdminStats, AdminUser } from "@/types/admin";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.role === "Admin") return <Badge label="ADMIN" bg="#7c3aed" />;
  if (user.hasActiveAccess && user.subscriptionStatus === "Active") return <Badge label="PAID" bg={colors.success} />;
  if (user.hasActiveAccess && user.subscriptionStatus === "Trial") return <Badge label="TRIAL" bg="#0891b2" />;
  return <Badge label="EXPIRED" bg={colors.danger} />;
}

function Badge({ label, bg }: { label: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function AdminScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => { load(); }, [])
  );

  async function load() {
    try {
      const [s, u] = await Promise.all([api.getAdminStats(), api.getAdminUsers()]);
      setStats(s);
      setUsers(u);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleActivate(user: AdminUser) {
    Alert.alert(
      "Activate Subscription",
      `Activate 1 month for ${user.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: async () => {
            setActionLoading(user.guidId);
            try {
              const updated = await api.activateSubscription(user.guidId, 1);
              setUsers(prev => prev.map(u => u.guidId === updated.guidId ? updated : u));
              await load();
            } catch {
              Alert.alert("Error", "Failed to activate. Try again.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  async function handleRevoke(user: AdminUser) {
    Alert.alert(
      "Revoke Access",
      `Revoke subscription for ${user.fullName}? They will lose access immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            setActionLoading(user.guidId);
            try {
              const updated = await api.revokeSubscription(user.guidId);
              setUsers(prev => prev.map(u => u.guidId === updated.guidId ? updated : u));
              await load();
            } catch {
              Alert.alert("Error", "Failed to revoke. Try again.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MenuButton />
      <ScreenContainer
        contentContainerStyle={styles.scrollPad}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.brand}
          />
        }
      >
        <ScreenHeading title="Admin Dashboard" subtitle="User overview and subscription management" />

        {/* Stats grid */}
        {stats && (
          <>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Active Trial" value={stats.activeTrialUsers} />
              <StatCard label="Expired Trial" value={stats.expiredTrialUsers} />
              <StatCard label="Paid Users" value={stats.activePaidUsers} />
              <StatCard
                label="Monthly Revenue"
                value={`$${stats.estimatedMonthlyRevenue.toFixed(0)}`}
                sub={`${stats.activePaidUsers} × $10`}
              />
              <StatCard label="Expired Paid" value={stats.expiredPaidUsers} />
            </View>
          </>
        )}

        {/* Users list */}
        <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
        <FlatList
          data={users}
          keyExtractor={u => u.guidId}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const expanded = expandedId === item.guidId;
            const isAdmin = item.role === "Admin";
            return (
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => setExpandedId(expanded ? null : item.guidId)}
                activeOpacity={0.8}
              >
                {/* Row header */}
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.fullName[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <StatusBadge user={item} />
                </View>

                {/* Expanded detail */}
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
                            <ActivityIndicator color={colors.brand} />
                          ) : (
                            <>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.activateBtn]}
                                onPress={() => handleActivate(item)}
                              >
                                <Text style={styles.activateBtnText}>✓ Activate 1 Month</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.revokeBtn]}
                                onPress={() => handleRevoke(item)}
                              >
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
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollPad: { padding: 20, paddingTop: 88 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.label, marginBottom: 12, marginTop: 4 },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 26, fontWeight: "800", color: colors.brand },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  statSub: { fontSize: 11, color: colors.textSubtle, marginTop: 2 },

  // Badge
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  // User cards
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  userRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandTint,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 16, fontWeight: "700", color: colors.brand },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "700", color: colors.text },
  userEmail: { fontSize: 12, color: colors.textMuted },

  // Expanded
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: 12,
    backgroundColor: colors.bg,
    gap: 8,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  activateBtn: { backgroundColor: colors.brand },
  activateBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  revokeBtn: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder },
  revokeBtnText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
});
