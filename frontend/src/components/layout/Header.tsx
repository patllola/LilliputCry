"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ProfileModal from "./ProfileModal";
import { getStoredUser, clearUser } from "@/lib/auth";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.fullName ?? null);
  }, [profileOpen, pathname]);

  function handleLogout() {
    clearUser();
    setUserName(null);
    router.push("/login");
  }

  const navItem = (active: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
      active
        ? "bg-brand-600 text-white shadow-sm"
        : "text-gray-600 hover:text-brand-700 hover:bg-brand-50"
    }`;

  if (isAuthPage) return null;

  return (
    <>
      <aside className="w-60 shrink-0 sticky top-0 h-screen flex flex-col bg-white border-r border-gray-100">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7 3 3 7.5 3 12c0 2.5 1 4.8 2.6 6.4L7 20h10l1.4-1.6C20 16.8 21 14.5 21 12c0-4.5-4-9-9-9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              LilliputCry
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/" className={navItem(pathname === "/")}>
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </Link>

          <Link href="/log" className={navItem(pathname === "/log")}>
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Feed
          </Link>

          <button onClick={() => setProfileOpen(true)} className={navItem(false)}>
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Update Profile
          </button>
        </nav>

        {/* User + Logout */}
        {userName && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <p className="text-sm text-gray-700 font-medium truncate">
              Welcome, <span className="text-brand-600">{userName.split(" ")[0]}</span>
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        )}
      </aside>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
