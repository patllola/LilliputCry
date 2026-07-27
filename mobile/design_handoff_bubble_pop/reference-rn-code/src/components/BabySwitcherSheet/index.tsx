import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import type { Baby } from "@/types/baby";

type Props = {
  visible: boolean;
  babies: Baby[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddBaby: () => void;
  onClose: () => void;
};

/** Bottom sheet listing every baby, with the active one checked. */
export function BabySwitcherSheet({ visible, babies, activeId, onSelect, onAddBaby, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.grabber} />
          <Text style={s.heading}>Your babies</Text>

          <View style={{ gap: 10 }}>
            {babies.map((b) => {
              const active = b.id === activeId;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => onSelect(b.id)}
                  style={[s.row, active && s.rowOn]}
                >
                  <View style={[s.avatar, { backgroundColor: b.color }]}>
                    <Text style={s.avatarText}>{b.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{b.name}</Text>
                    <Text style={s.age}>{b.age}</Text>
                  </View>
                  <View style={[s.check, active && s.checkOn]}>
                    {active ? <Text style={s.checkGlyph}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onAddBaby} style={s.add}>
            <Text style={s.addText}>+  Add another baby</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,10,25,.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  grabber: { width: 40, height: 4, borderRadius: 3, backgroundColor: colors.line, alignSelf: "center", marginBottom: 14 },
  heading: { fontSize: 16, color: colors.text, fontFamily: fonts.black, marginBottom: 14 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: 18, padding: 11,
  },
  rowOn: { backgroundColor: colors.bg, borderColor: colors.accent },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, color: "#fff", fontFamily: fonts.black },
  name: { fontSize: 15, color: colors.text, fontFamily: fonts.black },
  age: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.bold },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkGlyph: { color: "#fff", fontSize: 14, fontFamily: fonts.black },
  add: {
    marginTop: 14, borderWidth: 1.5, borderColor: colors.accent, borderStyle: "dashed",
    backgroundColor: colors.bg, borderRadius: 18, paddingVertical: 14, alignItems: "center",
  },
  addText: { color: colors.accent, fontSize: 15, fontFamily: fonts.black },
});
