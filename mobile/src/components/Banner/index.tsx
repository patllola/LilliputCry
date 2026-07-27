import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type BannerProps = {
  message: string;
  variant?: "error" | "success";
};

export function Banner({ message, variant = "error" }: BannerProps) {
  return (
    <Text style={[styles.base, variant === "error" ? styles.error : styles.success]}>{message}</Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 12.5, fontFamily: fonts.bold, marginTop: 10, padding: 11, borderRadius: 14 },
  error: { color: colors.danger, backgroundColor: colors.dangerBg },
  success: { color: colors.success, backgroundColor: colors.successBg, textAlign: "center" },
});
