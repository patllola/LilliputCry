import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: string }) {
  return <Text style={styles.para}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>

        <Para>
          LilliputCry LLC ("we", "us", or "our") is committed to protecting your privacy. This
          Privacy Policy explains what information we collect, how we use it, and your rights
          regarding your data.
        </Para>

        <Section title="1. Information We Collect">
          <Para>We collect the following information when you use LilliputCry:</Para>

          <Text style={styles.subTitle}>Account Information</Text>
          <Bullet>Full name and email address</Bullet>
          <Bullet>Password (stored as a secure hash — we never see your actual password)</Bullet>
          <Bullet>Phone number, country, city, gender (optional)</Bullet>
          <Bullet>Profile picture URL (optional)</Bullet>

          <Text style={styles.subTitle}>Baby Tracking Data</Text>
          <Bullet>Feeding logs: time, milk prepared, milk fed, notes</Bullet>
          <Bullet>Sleep sessions: start time, end time, nap or night sleep, notes</Bullet>
          <Bullet>Pump sessions: left/right breast output, time, notes</Bullet>
          <Bullet>Milestone photos and achievement notes</Bullet>

          <Text style={styles.subTitle}>Technical Data</Text>
          <Bullet>IP address (for rate limiting and security)</Bullet>
          <Bullet>App usage timestamps</Bullet>
        </Section>

        <Section title="2. How We Use Your Information">
          <Para>We use your information solely to provide the LilliputCry service:</Para>
          <Bullet>Display your tracking data back to you</Bullet>
          <Bullet>Authenticate your account securely</Bullet>
          <Bullet>Send account-related emails (password reset, subscription notices)</Bullet>
          <Bullet>Manage your subscription status</Bullet>
          <Bullet>Improve app performance and fix bugs</Bullet>
        </Section>

        <Section title="3. Data Storage">
          <Para>Your data is stored on the following secure services:</Para>
          <Bullet>Account and tracking data: PostgreSQL database hosted on Neon (neon.tech) — servers located in the United States</Bullet>
          <Bullet>Milestone photos: Cloudinary (cloudinary.com) — a secure cloud media service</Bullet>
          <Bullet>Authentication tokens: stored securely on your device using Expo SecureStore</Bullet>
        </Section>

        <Section title="4. Data Sharing">
          <Para>
            We do not sell, rent, or share your personal data with third parties for marketing
            purposes. We only share data in the following limited cases:
          </Para>
          <Bullet>With Stripe (payment processor) when you subscribe — only payment-related data</Bullet>
          <Bullet>If required by law or valid legal process</Bullet>
          <Bullet>To protect the safety of users or the public</Bullet>
        </Section>

        <Section title="5. Children's Privacy (COPPA)">
          <Para>
            LilliputCry is designed for parents and caregivers who are 18 or older. We do not
            knowingly collect personal information directly from children under 13.
          </Para>
          <Para>
            The baby tracking data (feeding, sleep, milestones) relates to infants in your care.
            This data is associated with your adult account only and is never used for advertising
            or shared with third parties.
          </Para>
          <Para>
            If you believe we have inadvertently collected data from a child under 13, please
            contact us immediately at support@lilliputcry.com and we will delete it promptly.
          </Para>
        </Section>

        <Section title="6. Data Retention">
          <Para>
            We retain your data for as long as your account is active. If you delete your account,
            we will delete all associated data within 30 days, except where we are required by law
            to retain it.
          </Para>
        </Section>

        <Section title="7. Your Rights">
          <Para>You have the right to:</Para>
          <Bullet>Access all data we hold about you</Bullet>
          <Bullet>Correct inaccurate data via the Profile screen</Bullet>
          <Bullet>Request deletion of your account and all data</Bullet>
          <Bullet>Export your data (contact us to request)</Bullet>
          <Bullet>Withdraw consent at any time by deleting your account</Bullet>
          <Para>
            To exercise any of these rights, contact us at support@lilliputcry.com
          </Para>
        </Section>

        <Section title="8. Security">
          <Para>
            We take security seriously. Passwords are hashed using BCrypt. All data is transmitted
            over HTTPS. Authentication uses JSON Web Tokens (JWT). Milestone photos are stored
            privately on Cloudinary with access controlled by your account.
          </Para>
          <Para>
            No system is 100% secure. If you suspect your account has been compromised, please
            contact us immediately.
          </Para>
        </Section>

        <Section title="9. Changes to This Policy">
          <Para>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via the app or email. The "last updated" date at the top of this page will
            always reflect the most recent version.
          </Para>
        </Section>

        <Section title="10. Contact Us">
          <Para>
            Questions or concerns about your privacy? We take these seriously and will respond
            within 5 business days.
          </Para>
          <Para>Email: support@lilliputcry.com</Para>
        </Section>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 60 },
  backText: { color: colors.brand, fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, color: colors.textSubtle, marginBottom: 16 },
  section: { marginTop: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
  subTitle: { fontSize: 13, fontWeight: "700", color: colors.label, marginTop: 10, marginBottom: 6 },
  para: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: 8 },
  bulletRow: { flexDirection: "row", marginBottom: 5, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: colors.textMuted, marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  footer: { height: 40 },
});
