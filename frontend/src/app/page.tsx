import type { Metadata } from "next";
import FeatureHub from "@/components/hub/FeatureHub";

export const metadata: Metadata = {
  title: "Home — LilliputCry",
};

export default function HomePage() {
  return <FeatureHub />;
}
