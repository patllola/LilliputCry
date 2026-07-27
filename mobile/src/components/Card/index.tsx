import { StyleSheet, View, type ViewProps } from "react-native";
import { colors } from "@/theme/colors";

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
});
