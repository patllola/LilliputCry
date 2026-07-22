import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer a Friend — LilliputCry",
};

export default function ReferPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-5">
      <div className="w-24 h-24 mx-auto rounded-[34px] bg-[#ffe0d3] flex items-center justify-center text-[#f07a4a]">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="13" rx="1.5" />
          <path d="M3 12h18M12 8v13M12 8S9.5 3.5 7 5.5 12 8 12 8zM12 8s2.5-4.5 5-2.5S12 8 12 8z" />
        </svg>
      </div>
      <h1 className="text-xl font-extrabold text-gray-900">Invite other parents</h1>
      <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">
        Share LilliputCry with fellow parents and earn rewards. Coming soon!
      </p>
      <button
        disabled
        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-2xl px-6 py-3 shadow-md opacity-60 cursor-not-allowed"
      >
        Share Invite
      </button>
    </div>
  );
}
