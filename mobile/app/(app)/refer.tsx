import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { ScreenShell } from "@/components/ScreenShell";
import { getStoredUser } from "@/lib/auth";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

function fallbackCode() {
  return `FRIEND-${new Date().getFullYear()}`;
}

export default function ReferScreen() {
  const [code, setCode] = useState(fallbackCode());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      const first = user?.fullName?.split(" ")[0];
      setCode(`${(first ?? "FRIEND").toUpperCase()}-${new Date().getFullYear()}`);
    })();
  }, []);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleShare() {
    Share.share({ message: `Use my code ${code} to join LilliputCry!` });
  }

  return (
    <ScreenShell title="Refer a Friend">
      <View style={styles.container}>
        <View style={styles.iconChip}>
          <Feather name="gift" size={46} color={colors.referIcon} />
        </View>

        <Text style={styles.title}>Invite other parents</Text>
        <Text style={styles.body}>
          Invite other parents to LilliputCry and earn rewards for every friend who joins.
        </Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{code}</Text>
          <Pressable onPress={handleCopy} hitSlop={8}>
            <Text style={styles.copyText}>{copied ? "Copied!" : "Copy"}</Text>
          </Pressable>
        </View>

        <Button title="Share Invite" onPress={handleShare} style={styles.shareButton} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 30, paddingHorizontal: 10, alignItems: "center" },
  iconChip: {
    width: 96,
    height: 96,
    borderRadius: 34,
    backgroundColor: colors.refer,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, marginTop: 16 },
  body: {
    fontSize: 13.5,
    fontFamily: fonts.semi,
    color: colors.muted,
    maxWidth: 220,
    lineHeight: 19.5,
    textAlign: "center",
    marginTop: 8,
  },
  codeBox: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: colors.bg,
  },
  codeText: { fontSize: 14, fontFamily: fonts.black, color: colors.accent, letterSpacing: 1 },
  copyText: { fontSize: 12, fontFamily: fonts.black, color: colors.muted },
  shareButton: { marginTop: 22, paddingHorizontal: 40, minWidth: 220 },
});
