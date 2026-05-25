"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FiEye as Eye,
  FiEyeOff as EyeOff,
  FiLock as Lock,
  FiArrowLeft as ArrowLeft,
  FiLoader as Loader2,
} from "react-icons/fi";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-yellow-400" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return toast.error("Password must contain an uppercase letter");
    if (!/[a-z]/.test(password)) return toast.error("Password must contain a lowercase letter");
    if (!/\d/.test(password)) return toast.error("Password must contain a number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return toast.error("Password must contain a special character");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successful! Please login.");
      setTimeout(() => router.push("/auth?tab=login"), 1500);
    } catch (err) {
      toast.error(err.message || "Failed to reset password. Link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden">
      <Toaster position="top-center" richColors />

      <div className="hidden lg:flex lg:w-1/2 relative bg-[#144D53] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F6F78] to-[#144D53]" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center p-5 lg:p-10 bg-white overflow-y-auto min-h-0">
        <div className="w-full max-w-md my-auto py-6">
          <div className="mb-8 text-center lg:text-left">
            <Link href="/" className="inline-block mb-4">
              <h1 className="font-jost text-4xl font-black text-[#144D53] tracking-tight">
                NUTRY<span className="text-[#E6A15A]">BITES</span>
              </h1>
            </Link>
            <h2 className="text-2xl font-jost font-bold text-slate-800">Reset Password</h2>
            <p className="text-slate-500 mt-2">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-2xl"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F6F78] transition-colors"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ml-1 ${strength.label === "Weak" ? "text-red-500" : strength.label === "Medium" ? "text-yellow-500" : "text-green-600"}`}>
                    {strength.label} — use uppercase, number & special char
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-2xl"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F6F78] transition-colors"
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 ml-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 ml-1">Passwords match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting || password !== confirmPassword || strength.score < 3}
              className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg mt-2"
            >
              {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <Link href="/auth?tab=login" className="text-sm text-[#1F6F78] font-bold hover:text-[#144D53] transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
