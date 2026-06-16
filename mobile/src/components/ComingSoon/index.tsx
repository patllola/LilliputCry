import { StyleSheet, Text, View } from "react-native";
import { MenuButton } from "@/components/MenuButton";
import { colors } from "@/theme/colors";

type ComingSoonProps = {
  emoji: string;
  title: string;
  description: string;
};

/** Placeholder screen for sidebar features not yet built. */
export function ComingSoon({ emoji, title, description }: ComingSoonProps) {
  return (
    <View style={styles.container}>
      <MenuButton />
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 8 },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.brandDark },
});
