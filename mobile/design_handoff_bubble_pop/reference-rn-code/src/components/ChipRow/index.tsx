import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  format?: (v: T) => string;
};

/** One-tap preset chips. Covers the common values so typing is the exception. */
export function ChipRow<T extends string | number>({ options, value, onChange, format }: Props<T>) {
  return (
    <View style={s.wrap}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={String(opt)}
            onPress={() => onChange(opt)}
            style={[s.chip, active ? s.chipOn : s.chipOff]}
          >
            <Text style={[s.label, active ? s.labelOn : s.labelOff]}>
              {format ? format(opt) : String(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1.5 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipOff: { backgroundColor: "transparent", borderColor: colors.line },
  label: { fontSize: 13, fontFamily: fonts.black },
  labelOn: { color: "#fff" },
  labelOff: { color: colors.text },
});
