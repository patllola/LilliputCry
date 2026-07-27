import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

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
      activeOpacity={0.85}
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
  base: { borderRadius: 18, paddingVertical: 15, alignItems: "center" },
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  danger: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.dangerLine },
  disabled: { opacity: 0.5 },
  text: { fontFamily: fonts.black, fontSize: 16 },
  primaryText: { color: "#fff" },
  secondaryText: { color: colors.text, fontSize: 15 },
  dangerText: { color: colors.danger, fontSize: 15 },
});
