import type { Metadata } from "next";
import MilestonesClient from "@/components/milestones/MilestonesClient";

export const metadata: Metadata = {
  title: "Milestones — LilliputCry",
};

export default function MilestonesPage() {
  return <MilestonesClient />;
}
