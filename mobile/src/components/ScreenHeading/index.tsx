import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type ScreenHeadingProps = {
  title: string;
  subtitle?: string;
  /** When provided, renders a centered emoji "logo" above the title (auth screens). */
  emoji?: string;
};

export function ScreenHeading({ title, subtitle, emoji }: ScreenHeadingProps) {
  if (emoji) {
    return (
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>{emoji}</Text>
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
  logoBox: { alignItems: "center", marginBottom: 32 },
  logoText: { fontSize: 48, marginBottom: 8 },
  logoTitle: { fontSize: 24, fontWeight: "700", color: colors.text },
  logoSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  heading: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted },
});
