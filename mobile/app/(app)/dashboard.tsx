import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/api";
import { getStoredUser } from "@/lib/auth";
import type { FeedingLog } from "@/types/feeding";
import type { UserProfile } from "@/types/user";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

function wastePercent(prepared: number, fed: number) {
  if (prepared === 0) return "0%";
  return `${Math.round(((prepared - fed) / prepared) * 100)}%`;
}

export default function DashboardScreen() {
  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [fetchedLogs, storedUser] = await Promise.all([api.getLogs(), getStoredUser()]);
      setLogs(fetchedLogs);
      setUser(storedUser);
    } catch {
      setError("Failed to load data. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const today = new Date().toDateString();
  const todayLogs = logs.filter((l) => new Date(l.fedAt).toDateString() === today);
  const totalPrepared = todayLogs.reduce((s, l) => s + l.milkPrepared, 0);
  const totalFed = todayLogs.reduce((s, l) => s + l.milkFed, 0);
  const lastLog = todayLogs[0];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#9333ea" />}
    >
      <Text style={styles.greeting}>
        Hello, {user?.fullName?.split(" ")[0] ?? "there"} 👋
      </Text>
      <Text style={styles.subGreeting}>Here&apos;s today&apos;s summary</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Feedings" value={String(todayLogs.length)} />
        <StatCard label="Prepared" value={`${totalPrepared}ml`} />
        <StatCard label="Fed" value={`${totalFed}ml`} />
        <StatCard label="Waste" value={wastePercent(totalPrepared, totalFed)} />
      </View>

      {lastLog && (
        <View style={styles.lastFeed}>
          <Text style={styles.sectionTitle}>Last feeding</Text>
          <Text style={styles.lastFeedTime}>{formatTime(lastLog.fedAt)}</Text>
          <Text style={styles.lastFeedDetail}>
            {lastLog.milkFed}ml fed · {lastLog.milkPrepared}ml prepared
          </Text>
        </View>
      )}

      {/* Recent logs */}
      <Text style={styles.sectionTitle}>Recent logs</Text>
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No feedings logged yet.</Text>
          <Text style={styles.emptySubText}>Tap &quot;Log Feed&quot; to add one.</Text>
        </View>
      ) : (
        logs.slice(0, 10).map((log) => (
          <View key={log.guidId} style={styles.logCard}>
            <View style={styles.logRow}>
              <Text style={styles.logTime}>{formatTime(log.fedAt)}</Text>
              <Text style={styles.logDate}>{formatDate(log.fedAt)}</Text>
            </View>
            <View style={styles.logRow}>
              <Text style={styles.logStat}>🍼 {log.milkFed}ml fed</Text>
              <Text style={styles.logStat}>Prepared: {log.milkPrepared}ml</Text>
            </View>
            {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingTop: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subGreeting: { fontSize: 14, color: "#6b7280", marginTop: 2, marginBottom: 20 },
  error: { color: "#dc2626", backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#9333ea" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  lastFeed: {
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  lastFeedTime: { fontSize: 28, fontWeight: "700", color: "#7e22ce", marginTop: 4 },
  lastFeedDetail: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#374151", marginBottom: 10 },
  logCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    elevation: 1,
  },
  logRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  logTime: { fontSize: 14, fontWeight: "600", color: "#111827" },
  logDate: { fontSize: 13, color: "#9ca3af" },
  logStat: { fontSize: 13, color: "#6b7280" },
  logNotes: { fontSize: 12, color: "#9ca3af", marginTop: 4, fontStyle: "italic" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6b7280" },
  emptySubText: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
});
