import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ScreenShell";
import { Button } from "@/components/Button";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import {
  PLANS,
  getCurrentPlan,
  setCurrentPlan,
  type PlanId,
  type Billing,
} from "@/lib/mockSubscription";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const BILLING_OPTIONS = [
  { value: "monthly" as Billing, label: "Monthly" },
  { value: "yearly" as Billing, label: "Yearly · save 20%" },
];

export default function PaymentPlanScreen() {
  const router = useRouter();
  const current = getCurrentPlan();
  const [billing, setBilling] = useState<Billing>(current.billing);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
    current.planId === "free" ? "plus" : current.planId
  );

  function handleContinue() {
    setCurrentPlan(selectedPlanId, billing);
    router.back();
  }

  return (
    <ScreenShell title="Payment Plan">
      <SegmentedToggle options={BILLING_OPTIONS} value={billing} onChange={setBilling} />

      <View style={styles.plans}>
        {PLANS.map((plan) => {
          const selected = plan.id === selectedPlanId;
          const price = billing === "monthly" ? plan.monthly : plan.yearly;
          const period =
            plan.id === "free" ? "forever" : billing === "monthly" ? "/month" : "/year";

          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlanId(plan.id)}
              style={[styles.planCard, selected ? styles.planCardSelected : styles.planCardUnselected]}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tagline}>{plan.tagline}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <Feather name="check" size={14} color="#fff" />}
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>${price}</Text>
                <Text style={styles.period}>{period}</Text>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={14} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={selectedPlanId === "free" ? "Stay on Free" : "Continue to Payment"}
        onPress={handleContinue}
        style={styles.continueButton}
      />
      <Text style={styles.footnote}>Cancel anytime · secure payment</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  plans: { gap: 12, marginTop: 18 },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
  },
  planCardUnselected: { borderColor: colors.line },
  planCardSelected: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 6,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  headerText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { fontSize: 16, fontFamily: fonts.black, color: colors.text },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
  },
  badgeText: { fontSize: 10, fontFamily: fonts.black, color: "#6b4fa8" },
  tagline: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.muted, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { backgroundColor: colors.accent, borderWidth: 0 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 10 },
  price: { fontSize: 27, fontFamily: fonts.black, color: colors.text },
  period: { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },
  features: { gap: 6, marginTop: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 12.5, fontFamily: fonts.semi, color: colors.text },
  continueButton: { marginTop: 20 },
  footnote: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.muted,
    textAlign: "center",
    marginTop: 10,
  },
});
