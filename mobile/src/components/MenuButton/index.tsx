import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

/**
 * Floating hamburger that opens the sidebar drawer.
 * Lives in the empty top padding the tab screens already reserve (paddingTop: 60),
 * offset down by the device safe-area inset so it clears the status bar / notch.
 */
type MenuButtonProps = {
  /** When true, the button sits in normal layout flow (no absolute positioning) — use it inside a header row. */
  inline?: boolean;
};

export function MenuButton({ inline = false }: MenuButtonProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={inline ? styles.btnInline : [styles.btn, { top: insets.top + 8 }]}
      hitSlop={12}
      accessibilityLabel="Open menu"
    >
      <Text style={styles.icon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
  },
  btnInline: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
  },
  icon: { fontSize: 28, color: colors.text, lineHeight: 30 },
});
