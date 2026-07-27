import {
  useState,
  useCallback,
  useRef,
  createRef,
  type RefObject,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Feather } from "@expo/vector-icons";
import { api } from "@/api";
import { getStoredUser } from "@/lib/auth";
import type { FeedingLog } from "@/types/feeding";
import type { UserProfile } from "@/types/user";
import { StatCard } from "@/components/StatCard";
import { Banner } from "@/components/Banner";
import { useBaby } from "@/lib/babyContext";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function wastePercent(prepared: number, fed: number) {
  if (prepared === 0) return "0%";
  return `${Math.round(((prepared - fed) / prepared) * 100)}%`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { activeBaby } = useBaby();
  const [logs, setLogs] = useState<FeedingLog[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swipeRefs = useRef<Map<string, RefObject<SwipeableMethods | null>>>(
    new Map()
  );

  function swipeRef(id: string) {
    let ref = swipeRefs.current.get(id);
    if (!ref) {
      ref = createRef<SwipeableMethods>();
      swipeRefs.current.set(id, ref);
    }
    return ref;
  }

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [fetchedLogs, storedUser] = await Promise.all([
        api.getLogs(activeBaby?.guidId),
        getStoredUser(),
      ]);
      setLogs(fetchedLogs);
      setUser(storedUser);
    } catch {
      setError("Failed to load data. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [activeBaby?.guidId])
  );

  function confirmDelete(log: FeedingLog) {
    Alert.alert(
      "Delete feeding?",
      "This will permanently remove the log. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => swipeRefs.current.get(log.guidId)?.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteLog(log.guidId);
              setLogs((prev) => prev.filter((l) => l.guidId !== log.guidId));
            } catch {
              Alert.alert("Error", "Failed to delete. Please try again.");
              swipeRefs.current.get(log.guidId)?.current?.close();
            }
          },
        },
      ]
    );
  }

  function renderRightAction(log: FeedingLog) {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => confirmDelete(log)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  const today = new Date().toDateString();
  const todayLogs = logs.filter(
    (l) => new Date(l.fedAt).toDateString() === today
  );
  const totalPrepared = todayLogs.reduce((s, l) => s + l.milkPrepared, 0);
  const totalFed = todayLogs.reduce((s, l) => s + l.milkFed, 0);
  const lastLog = todayLogs[0];

  const topHeader = (
    <SafeAreaView edges={["top"]} style={styles.safeHeader}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>History</Text>
      </View>
    </SafeAreaView>
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        {topHeader}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  const header = (
    <>
      <Text style={styles.greeting}>
        Hello, {user?.fullName?.split(" ")[0] ?? "there"} 👋
      </Text>
      <Text style={styles.subGreeting}>Here's today's summary</Text>

      {error && <Banner message={error} />}

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

      <Text style={styles.sectionTitle}>Recent logs</Text>
    </>
  );

  return (
    <View style={styles.screen}>
      {topHeader}
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={logs.slice(0, 10)}
        keyExtractor={(log) => log.guidId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No feedings logged yet.</Text>
            <Text style={styles.emptySubText}>
              Tap &quot;Log Feed&quot; to add one.
            </Text>
          </View>
        }
        renderItem={({ item: log }) => (
          <ReanimatedSwipeable
            ref={swipeRef(log.guidId)}
            renderRightActions={() => renderRightAction(log)}
            overshootRight={false}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/edit-log/${log.guidId}`)}
              style={styles.logCard}
            >
              <View style={styles.logRow}>
                <Text style={styles.logTime}>{formatTime(log.fedAt)}</Text>
                <Text style={styles.logDate}>{formatDate(log.fedAt)}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logStat}>🍼 {log.milkFed}ml fed</Text>
                <Text style={styles.logStat}>
                  Prepared: {log.milkPrepared}ml
                </Text>
              </View>
              {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
            </TouchableOpacity>
          </ReanimatedSwipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safeHeader: { backgroundColor: colors.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    paddingBottom: 0,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.black, color: colors.text },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingTop: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  greeting: {
    fontSize: 22,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: "right",
  },
  subGreeting: {
    fontSize: 14,
    fontFamily: fonts.semi,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 20,
    textAlign: "right",
  },
  statsRow: { flexDirection: "row", gap: 10, marginVertical: 12 },
  lastFeed: {
    backgroundColor: colors.feeding,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  lastFeedTime: {
    fontSize: 28,
    fontFamily: fonts.black,
    color: colors.text,
    marginTop: 4,
  },
  lastFeedDetail: {
    fontSize: 13,
    fontFamily: fonts.semi,
    color: colors.muted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.black,
    color: colors.text,
    marginBottom: 10,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logTime: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  logDate: { fontSize: 13, fontFamily: fonts.semi, color: colors.muted },
  logStat: { fontSize: 13, fontFamily: fonts.semi, color: colors.muted },
  logNotes: {
    fontSize: 12,
    fontFamily: fonts.semi,
    color: colors.muted,
    marginTop: 4,
    fontStyle: "italic",
  },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, fontFamily: fonts.black, color: colors.muted },
  emptySubText: {
    fontSize: 13,
    fontFamily: fonts.semi,
    color: colors.muted,
    marginTop: 4,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 10,
    borderRadius: 18,
    marginLeft: 8,
  },
  deleteActionText: { color: "#fff", fontFamily: fonts.black, fontSize: 14 },
});
