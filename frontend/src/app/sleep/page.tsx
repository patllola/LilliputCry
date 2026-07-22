import type { Metadata } from "next";
import SleepClient from "@/components/sleep/SleepClient";

export const metadata: Metadata = {
  title: "Sleep — LilliputCry",
};

export default function SleepPage() {
  return <SleepClient />;
}
