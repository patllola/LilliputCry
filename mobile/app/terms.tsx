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

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>

        <Para>
          Welcome to LilliputCry. By creating an account or using our app, you agree to these
          Terms of Service. Please read them carefully.
        </Para>

        <Section title="1. About LilliputCry">
          <Para>
            LilliputCry is a baby care tracking application that helps parents and caregivers
            log feeding sessions, sleep patterns, breast pump sessions, and baby milestones.
            The service is operated by LilliputCry LLC.
          </Para>
        </Section>

        <Section title="2. Eligibility">
          <Para>You must be at least 18 years old to create an account. By registering, you confirm that:</Para>
          <Bullet>You are 18 years of age or older</Bullet>
          <Bullet>The information you provide is accurate and complete</Bullet>
          <Bullet>You will keep your account credentials secure</Bullet>
        </Section>

        <Section title="3. Free Trial & Subscription">
          <Para>
            New accounts receive a 30-day free trial with full access to all features. After the
            trial period ends, continued access requires a paid subscription.
          </Para>
          <Bullet>Subscription price: $10.00 USD per month</Bullet>
          <Bullet>Subscriptions are activated manually by an admin after payment is confirmed</Bullet>
          <Bullet>There are no automatic renewals at this time</Bullet>
          <Bullet>Refunds are considered on a case-by-case basis — contact us within 7 days of payment</Bullet>
        </Section>

        <Section title="4. Acceptable Use">
          <Para>You agree NOT to:</Para>
          <Bullet>Use the app for any unlawful purpose</Bullet>
          <Bullet>Share your account with others</Bullet>
          <Bullet>Attempt to reverse engineer or tamper with the app</Bullet>
          <Bullet>Upload content that is offensive, illegal, or violates others' rights</Bullet>
          <Bullet>Use the app to store data about children who are not in your care</Bullet>
        </Section>

        <Section title="5. Your Data">
          <Para>
            You own the data you enter into LilliputCry. You can request deletion of your account
            and all associated data at any time by contacting us. We will process deletion requests
            within 30 days.
          </Para>
          <Para>
            Please review our Privacy Policy to understand how we collect, use, and protect your data.
          </Para>
        </Section>

        <Section title="6. Milestone Photos">
          <Para>
            Photos you upload are stored securely on Cloudinary, a cloud media service. By uploading
            photos you confirm you have the right to do so. We do not use your photos for any purpose
            other than displaying them to you within the app.
          </Para>
        </Section>

        <Section title="7. Service Availability">
          <Para>
            We aim for 99% uptime but do not guarantee uninterrupted access. We may perform
            maintenance, updates, or experience outages. We are not liable for any loss caused
            by service interruptions.
          </Para>
        </Section>

        <Section title="8. Limitation of Liability">
          <Para>
            LilliputCry is a tracking tool only — it does not provide medical advice. Always
            consult a qualified healthcare professional for medical questions about your baby.
          </Para>
          <Para>
            To the maximum extent permitted by law, LilliputCry LLC shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of the app.
          </Para>
        </Section>

        <Section title="9. Changes to Terms">
          <Para>
            We may update these terms from time to time. We will notify you of significant changes
            via the app or email. Continued use after changes constitutes acceptance of the new terms.
          </Para>
        </Section>

        <Section title="10. Contact">
          <Para>
            Questions about these terms? Contact us at support@lilliputcry.com
          </Para>
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
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 60 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, color: colors.muted, marginBottom: 16 },
  section: { marginTop: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
  para: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 8 },
  bulletRow: { flexDirection: "row", marginBottom: 5, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: colors.muted, marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 22 },
  footer: { height: 40 },
});
