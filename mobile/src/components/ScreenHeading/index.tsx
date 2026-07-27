import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type ScreenHeadingProps = {
  title: string;
  subtitle?: string;
  /** When provided, renders a centered icon-chip "logo" above the title (auth screens). */
  emoji?: string;
};

export function ScreenHeading({ title, subtitle, emoji }: ScreenHeadingProps) {
  if (emoji) {
    return (
      <View style={styles.logoBox}>
        <View style={styles.logoChip}>
          <Text style={styles.logoEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.logoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.logoSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logoBox: { alignItems: "center", marginBottom: 22 },
  logoChip: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: colors.heroFrom,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 32 },
  logoTitle: { fontSize: 24, fontFamily: fonts.black, color: colors.text, textAlign: "center" },
  logoSubtitle: { fontSize: 12.5, fontFamily: fonts.bold, color: colors.muted, marginTop: 4, textAlign: "center" },
  heading: { marginBottom: 20 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12.5, fontFamily: fonts.bold, color: colors.muted },
});
