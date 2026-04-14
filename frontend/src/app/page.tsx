import type { Metadata } from "next";
import { api } from "@/api";
import { FeedingLog } from "@/types/feeding";
import StatsBar from "@/components/feeding/StatsBar";
import FeedingList from "@/components/feeding/FeedingList";
import FeedingForm from "@/components/feeding/FeedingForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — TinyTrack",
};

export default async function DashboardPage() {
  let logs: FeedingLog[] = [];
  let fetchError = false;

  try {
    logs = await api.getLogs();
  } catch {
    fetchError = true;
  }

  return (
    <div className="space-y-8">
      {/* Log a Feeding */}
      <Card>
        <CardHeader>
          <CardTitle>Log a Feeding</CardTitle>
        </CardHeader>
        <FeedingForm hideCancel />
      </Card>

      {/* Previous Logs */}
      {fetchError ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
          <p className="text-red-600 font-medium">Could not connect to the server.</p>
          <p className="text-sm text-red-400 mt-1">
            Make sure the backend is running at{" "}
            <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000"}
            </code>
          </p>
        </div>
      ) : (
        <>
          <StatsBar logs={logs} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Logs</h2>
            <FeedingList logs={logs} />
          </div>
        </>
      )}
    </div>
  );
}
