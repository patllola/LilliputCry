import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  title: string;
  subtitle: string;
  tint: string;
  icon: ReactNode;
  onPress: () => void;
};

/** A single hub tile. Two per row in a wrapping grid. */
export function FeatureCard({ title, subtitle, tint, icon, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[s.card, { backgroundColor: tint }]}>
      <View style={s.iconWrap}>{icon}</View>
      <View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: "47%",
    borderRadius: 24,
    padding: 15,
    gap: 9,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, color: colors.text, fontFamily: fonts.black },
  subtitle: { fontSize: 11.5, color: "rgba(74,47,66,.5)", fontFamily: fonts.bold, marginTop: 1 },
});
