import type { Metadata } from "next";
import MedicationsClient from "@/components/medications/MedicationsClient";

export const metadata: Metadata = {
  title: "Medication — LilliputCry",
};

export default function MedicationsPage() {
  return <MedicationsClient />;
}
