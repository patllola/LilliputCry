import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export function PrimaryButton({
  label, onPress, disabled,
}: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, pressed && s.pressed, disabled && s.disabled]}
    >
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    marginTop: 18, backgroundColor: colors.accent, borderRadius: 18,
    paddingVertical: 15, alignItems: "center",
    shadowColor: colors.accent, shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 14, elevation: 4,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, color: "#fff", fontFamily: fonts.black },
});
