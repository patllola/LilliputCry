import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

/** Segmented control for 2-3 mutually exclusive modes (Night/Nap, gender…). */
export function SegmentedToggle<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={s.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[s.seg, active && s.segOn]}
          >
            <Text style={[s.label, active ? s.labelOn : s.labelOff]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  track: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: 16, padding: 4, gap: 4 },
  seg: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  segOn: { backgroundColor: colors.accent },
  label: { fontSize: 13, fontFamily: fonts.black },
  labelOn: { color: "#fff" },
  labelOff: { color: colors.muted },
});
