"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiMail as Mail, FiArrowLeft as ArrowLeft, FiLoader as Loader2 } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await forgotPassword(email);
      toast.success("If your email is registered, you will receive a password reset link");
      router.push("/auth?tab=login");
    } catch (err) {
      toast.error(err.message || "Failed to request password reset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 py-8 px-4">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1F6F78] to-[#1a7a68] px-8 py-6 text-white">
            <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
            <p className="text-emerald-100/90 text-sm mt-1">
              Enter your email and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || loading}
                className="w-full h-11 bg-[#1F6F78] hover:bg-[#125043]"
              >
                {submitting || loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <Link href="/auth" className="text-sm text-[#1F6F78] font-medium hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
