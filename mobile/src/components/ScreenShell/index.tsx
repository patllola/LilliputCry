import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Props = {
  title: string;
  children: ReactNode;
  scrollProps?: Record<string, unknown>;
};

/** Back-arrow header + scrollable body. Every non-tab-root screen uses this. */
export function ScreenShell({ title, children, scrollProps }: Props) {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
        >
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back} hitSlop={8}>
              <Feather name="chevron-left" size={20} color={colors.text} />
            </Pressable>
            <Text style={s.title}>{title}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  back: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, color: colors.text, fontFamily: fonts.black },
});
