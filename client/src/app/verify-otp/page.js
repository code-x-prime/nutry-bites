"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FiMail as Mail, FiLoader as Loader2, FiArrowLeft as ArrowLeft } from "react-icons/fi";
import Image from "next/image";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyOtp, resendVerification } = useAuth();

  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const otpString = otp.join("");

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    if (!/^\d{6}$/.test(otpString)) return toast.error("Enter 6-digit OTP");

    setIsSubmitting(true);
    try {
      await verifyOtp(email, otpString);
      toast.success("Email verified successfully. You can now login.");
      setTimeout(() => router.push("/auth"), 500);
    } catch (err) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return toast.error("Enter your email to resend OTP");
    try {
      await resendVerification(email);
      toast.success("OTP sent to your email");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
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
            alt="Healthy Bowl"
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
              Email Verification
            </h2>
            <p className="text-slate-500 mt-2">
              Enter the 6-digit code sent to <span className="font-bold text-[#144D53]">{email || "your email"}</span>.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 ml-1">Verification Code</label>
              <div className="flex gap-2 justify-between">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-16 text-center text-2xl font-black border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-[#1F6F78] focus:bg-white focus:ring-4 focus:ring-[#1F6F78]/10 outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#1F6F78]/20 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify & Continue"}
              </Button>

              <button
                type="button"
                className="text-sm font-bold text-[#1F6F78] hover:text-[#144D53] disabled:text-slate-400 transition-colors py-2"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive a code? Resend"}
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-2">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <Link href="/auth" className="text-sm text-[#1F6F78] font-bold hover:text-[#144D53] transition-colors">
              Back to Sign In
            </Link>
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
