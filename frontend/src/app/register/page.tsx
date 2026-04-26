"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/api";
import { storeUser, storeToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credential: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.googleSignIn(credential);
      storeUser(res.user);
      if (res.token) storeToken(res.token);
      router.push("/");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        fullName,
        email,
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      storeUser(res.user);
      if (res.token) storeToken(res.token);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email_already_exists")) {
        setError("An account with this email already exists.");
      } else if (msg.includes("user_already_exists")) {
        setError("An account with this name and phone number already exists.");
      } else {
        setError("Registration failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md mx-auto">
            <svg
              className="w-8 h-8 text-white"
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
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500">Start tracking with LilliputCry</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <Input
            label="Full name"
            placeholder="e.g. Sarah Johnson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            hint="Minimum 6 characters"
          />
          <Input
            label="Phone number (optional)"
            type="tel"
            placeholder="e.g. +1 555 000 0000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-xs text-gray-400 bg-transparent">or continue with</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Google sign-in */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(res) => res.credential && handleGoogleSuccess(res.credential)}
            onError={() => setError("Google sign-in failed. Please try again.")}
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
            width="340"
          />
        </div>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
