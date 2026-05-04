"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiMail as Mail, FiArrowLeft as ArrowLeft, FiLoader as Loader2 } from "react-icons/fi";
import Image from "next/image";

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
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Left Column: Visual Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#144D53] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-banner.png"
            alt="Healthy Food"
            width={1920}
            height={1080}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            className="object-cover opacity-80 scale-105 animate-subtle-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#144D53] via-[#144D53]/20 to-transparent" />
        </div>


      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-20 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-10 text-center lg:text-left">
            <Link href="/" className="inline-block mb-6">
              <h1 className="font-jost text-4xl font-black text-[#144D53] tracking-tight">
                NUTRY<span className="text-[#E6A15A]">BITES</span>
              </h1>
            </Link>
            <h2 className="text-2xl font-jost font-bold text-slate-800">
              Recover Password
            </h2>
            <p className="text-slate-500 mt-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-2xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || loading}
              className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#1F6F78]/20 transition-all active:scale-[0.98]"
            >
              {submitting || loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-2">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <Link href="/auth" className="text-sm text-[#1F6F78] font-bold hover:text-[#144D53] transition-colors">
              Back to Sign In
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <p className="text-slate-400 text-xs">
              Need more help? <Link href="/contact" className="text-slate-600 underline font-medium">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
