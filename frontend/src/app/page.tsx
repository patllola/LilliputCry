import type { Metadata } from "next";
import DashboardClient from "@/components/feeding/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — LilliputCry",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
