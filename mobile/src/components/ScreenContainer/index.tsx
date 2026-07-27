import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "@/theme/colors";

type ScreenContainerProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Vertically centers content (used by the auth screens). */
  centered?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
};

export function ScreenContainer({ children, contentContainerStyle, centered, refreshControl }: ScreenContainerProps) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[centered ? styles.centered : styles.container, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 18, paddingTop: 60 },
  centered: { flexGrow: 1, justifyContent: "center", padding: 24 },
});
