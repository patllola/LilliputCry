import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useBaby } from "@/lib/babyContext";
import { formatBabyAge } from "@/lib/babyFormat";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type BabySwitcherModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BabySwitcherModal({ visible, onClose }: BabySwitcherModalProps) {
  const router = useRouter();
  const { babies, activeBaby, selectBaby } = useBaby();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Your babies</Text>

          <View style={{ gap: 10 }}>
            {babies.map((b) => {
              const active = b.guidId === activeBaby?.guidId;
              return (
                <TouchableOpacity
                  key={b.guidId}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    selectBaby(b.guidId);
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.avatar, { backgroundColor: b.avatarColor }]}>
                    <Text style={styles.avatarText}>{b.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{b.name}</Text>
                    <Text style={styles.age}>{formatBabyAge(b.dateOfBirth)}</Text>
                  </View>
                  <View style={[styles.check, active && styles.checkOn]}>
                    {active ? <Text style={styles.checkText}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              onClose();
              router.push("/add-baby");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+  Add another baby</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,10,25,.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
  },
  handle: { width: 40, height: 4, borderRadius: 3, backgroundColor: colors.line, alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 16, fontFamily: fonts.black, color: colors.text, marginBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 11,
  },
  rowActive: { borderColor: colors.accent, backgroundColor: colors.bg },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: fonts.black },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: fonts.black, color: colors.text },
  age: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { color: "#fff", fontSize: 14, fontFamily: fonts.black },
  addBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: "dashed",
    backgroundColor: colors.bg,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: { color: colors.accent, fontSize: 15, fontFamily: fonts.black },
});
