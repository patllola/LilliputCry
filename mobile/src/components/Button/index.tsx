import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "@/theme/colors";

type Variant = "primary" | "secondary" | "danger";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerStyle =
    variant === "primary" ? styles.primary : variant === "secondary" ? styles.secondary : styles.danger;
  const textStyle =
    variant === "primary" ? styles.primaryText : variant === "secondary" ? styles.secondaryText : styles.dangerText;

  return (
    <TouchableOpacity
      style={[styles.base, containerStyle, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.text} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.dangerBorder },
  disabled: { opacity: 0.6 },
  text: { fontWeight: "700", fontSize: 16 },
  primaryText: { color: "#fff" },
  secondaryText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  dangerText: { color: colors.danger, fontSize: 15 },
});
