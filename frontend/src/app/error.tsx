"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-700 font-semibold mb-1">Something went wrong</p>
      <p className="text-sm text-red-500 mb-4">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
