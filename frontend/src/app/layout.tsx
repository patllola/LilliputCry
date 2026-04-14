import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

const geist = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "LilliputCry — Baby Feeding Tracker",
  description: "Track your baby's feeding sessions, milk quantities, and patterns with ease.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="antialiased flex min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
