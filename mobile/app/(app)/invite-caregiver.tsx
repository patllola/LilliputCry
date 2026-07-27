import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ScreenShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Banner } from "@/components/Banner";
import { useBaby } from "@/lib/babyContext";
import {
  ROLE_LABELS,
  listPendingInvites,
  sendInvite,
  cancelInvite,
  type Role,
  type PendingInvite,
} from "@/lib/mockCaregivers";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS: { role: Role; name: string; description: string }[] = [
  {
    role: "full",
    name: "Full access",
    description: "Log everything, edit the baby profile, and invite others.",
  },
  {
    role: "log",
    name: "Log only",
    description: "Add feeds, sleep, pumping and meds. Can't change settings.",
  },
  {
    role: "read",
    name: "Read only",
    description: "See the history and reminders, but can't add or edit.",
  },
];

export default function InviteCaregiverScreen() {
  const { activeBaby } = useBaby();
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("log");
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>(() => listPendingInvites());

  function handleSendInvite() {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    sendInvite(trimmed, selectedRole);
    setEmail("");
    setInvites(listPendingInvites());
  }

  function handleCancelInvite(id: string) {
    cancelInvite(id);
    setInvites(listPendingInvites());
  }

  return (
    <ScreenShell title="Invite Caregiver">
      <Card>
        <FormField
          label="Their email"
          placeholder="grandma@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.helper}>
          They&apos;ll create their own password, then see{" "}
          {activeBaby?.name ?? "your baby"}&apos;s profile.
        </Text>

        {error && <Banner message={error} />}

        <Text style={styles.roleLabel}>What can they do?</Text>
        <View style={styles.roleList}>
          {ROLE_OPTIONS.map((opt) => {
            const selected = opt.role === selectedRole;
            return (
              <Pressable
                key={opt.role}
                onPress={() => setSelectedRole(opt.role)}
                style={[
                  styles.roleCard,
                  selected ? styles.roleCardSelected : styles.roleCardUnselected,
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <Feather name="check" size={13} color="#fff" />}
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={styles.roleName}>{opt.name}</Text>
                  <Text style={styles.roleDescription}>{opt.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button title="Send Invite" onPress={handleSendInvite} style={styles.sendButton} />
      </Card>

      {invites.length > 0 && (
        <>
          <Text style={styles.pendingTitle}>Pending invites</Text>
          <View style={styles.pendingList}>
            {invites.map((invite) => (
              <View key={invite.id} style={styles.pendingRow}>
                <View style={styles.pendingIcon}>
                  <Feather name="mail" size={16} color={colors.muted} />
                </View>
                <View style={styles.pendingTextWrap}>
                  <Text style={styles.pendingEmail}>{invite.email}</Text>
                  <Text style={styles.pendingMeta}>
                    Invited {invite.invitedLabel} · {ROLE_LABELS[invite.role]}
                  </Text>
                </View>
                <Pressable onPress={() => handleCancelInvite(invite.id)} hitSlop={8}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  helper: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted, marginTop: 8 },
  roleLabel: {
    fontSize: 12.5,
    fontFamily: fonts.black,
    color: colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  roleList: { gap: 10 },
  roleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 13,
    borderRadius: 18,
    borderWidth: 2,
  },
  roleCardSelected: { borderColor: colors.accent, backgroundColor: colors.bg },
  roleCardUnselected: { borderColor: colors.line, backgroundColor: "transparent" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  radioSelected: { backgroundColor: colors.accent, borderWidth: 0 },
  roleTextWrap: { flex: 1 },
  roleName: { fontSize: 14, fontFamily: fonts.black, color: colors.text },
  roleDescription: {
    fontSize: 11.5,
    fontFamily: fonts.semi,
    color: colors.muted,
    lineHeight: 16.7,
    marginTop: 2,
  },
  sendButton: { marginTop: 18 },
  pendingTitle: {
    fontSize: 14,
    fontFamily: fonts.black,
    color: colors.text,
    marginTop: 22,
    marginBottom: 10,
  },
  pendingList: { gap: 10 },
  pendingRow: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: 20,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  pendingIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingTextWrap: { flex: 1 },
  pendingEmail: { fontSize: 13.5, fontFamily: fonts.black, color: colors.text },
  pendingMeta: { fontSize: 11, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  cancelText: { fontSize: 11.5, fontFamily: fonts.black, color: colors.muted },
});
