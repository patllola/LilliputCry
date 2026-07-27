import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type FormFieldProps = TextInputProps & {
  label: string;
  multiline?: boolean;
};

export function FormField({ label, multiline, style, ...inputProps }: FormFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea, style]}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12.5, fontFamily: fonts.black, color: colors.text, marginBottom: 8, marginTop: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.semi,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  textarea: { height: 80, textAlignVertical: "top" },
});
