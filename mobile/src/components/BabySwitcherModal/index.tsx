import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AddBabyModal } from "@/components/AddBabyModal";
import { useBaby } from "@/lib/babyContext";
import { formatBabyAge } from "@/lib/babyFormat";
import { colors } from "@/theme/colors";

type BabySwitcherModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BabySwitcherModal({ visible, onClose }: BabySwitcherModalProps) {
  const { babies, activeBaby, selectBaby } = useBaby();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Your babies</Text>

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
                  activeOpacity={0.8}
                >
                  <View style={[styles.avatar, { backgroundColor: b.avatarColor }]}>
                    <Text style={styles.avatarText}>{b.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{b.name}</Text>
                    <Text style={styles.age}>{formatBabyAge(b.dateOfBirth)}</Text>
                  </View>
                  {active && (
                    <View style={styles.check}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add another baby</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddBabyModal visible={adding} onClose={() => setAdding(false)} onAdded={onClose} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderLight, alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  rowActive: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "800", color: colors.text },
  age: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  checkText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: colors.brand, fontWeight: "800", fontSize: 14 },
});
