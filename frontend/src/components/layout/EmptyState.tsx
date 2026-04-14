import Link from "next/link";
import Button from "@/components/ui/Button";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-brand-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3C7 3 3 7.5 3 12c0 2.5 1 4.8 2.6 6.4L7 20h10l1.4-1.6C20 16.8 21 14.5 21 12c0-4.5-4-9-9-9z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No feeding logs yet</h3>
      <p className="text-gray-500 max-w-xs mb-8">
        Start tracking your baby's feeding sessions to see their patterns over time.
      </p>
      <Link href="/log">
        <Button size="lg">Log First Feeding</Button>
      </Link>
    </div>
  );
}
