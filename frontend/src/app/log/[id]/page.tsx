import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/api";
import FeedingForm from "@/components/feeding/FeedingForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edit Feeding — LilliputCry",
};

interface EditFeedingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFeedingPage({ params }: EditFeedingPageProps) {
  const { id } = await params;

  let log;
  try {
    log = await api.getLog(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-gray-500 hover:text-brand-600"
          title="Back to dashboard"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Feeding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update this feeding session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feeding details</CardTitle>
        </CardHeader>
        <FeedingForm initialLog={log} />
      </Card>
    </div>
  );
}
