import type { Metadata } from "next";
import PumpClient from "@/components/pump/PumpClient";

export const metadata: Metadata = {
  title: "Milk Pump — LilliputCry",
};

export default function PumpPage() {
  return <PumpClient />;
}
