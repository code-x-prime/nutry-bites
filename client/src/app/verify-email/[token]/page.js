"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import { DynamicIcon } from "@/components/dynamic-icon";
import Image from "next/image";

// Helper function to check if token was already verified in this session
const wasTokenVerifiedInSession = (token) => {
  if (typeof window === "undefined") return false;

  try {
    const verified = localStorage.getItem(`verified_${token}`);
    return verified === "true";
  } catch (e) {
    console.error("Error checking token verification status:", e);
    return false;
  }
};

// Helper function to mark token as verified in this session
const markTokenAsVerifiedInSession = (token) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`verified_${token}`, "true");
  } catch (e) {
    console.error("Failed to mark token as verified in session", e);
  }
};

export default function VerifyEmailPage({ params }) {
  const router = useRouter();
  const { token } = params;
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState("initial"); // initial, verifying, success, error, resent
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Use a ref to ensure verification is only attempted once
  const verificationAttemptedRef = useRef(false);
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Auto redirect after successful verification
  useEffect(() => {
    let timer;
    if (status === "success" && redirectCountdown > 0) {
      timer = setTimeout(() => {
        if (isMounted.current) {
          setRedirectCountdown((prev) => prev - 1);
        }
      }, 1000);
    } else if (status === "success" && redirectCountdown === 0) {
      router.push("/auth");
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, redirectCountdown, router]);

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if no token or already attempted verification
    if (!token || verificationAttemptedRef.current) {
      return;
    }

    // Set verification attempted flag to prevent multiple attempts
    verificationAttemptedRef.current = true;

    // Check if this token was already verified in this session
    if (wasTokenVerifiedInSession(token)) {
      if (isMounted.current) {
        console.log("Token already verified in this session");
        setStatus("success");
        setMessage("Your email has been verified successfully.");
      }
      return;
    }

    const verify = async () => {
      // Set state to verifying
      if (isMounted.current) {
        setStatus("verifying");
      }

      try {
        const response = await verifyEmail(token);

        // Mark token as verified AFTER successful verification
        markTokenAsVerifiedInSession(token);

        // Only update state if component is still mounted
        if (isMounted.current) {
          setStatus("success");
          setMessage(response.message || "Email verified successfully");
        }
      } catch (error) {
        console.error("Verification error:", error);

        // Only update state if component is still mounted
        if (!isMounted.current) return;

        // Special case: If the error is that the email was already verified,
        // treat it as a success and mark as verified in session
        if (
          error.message &&
          (error.message.toLowerCase().includes("already verified") ||
            error.message.includes("Verification already attempted"))
        ) {
          markTokenAsVerifiedInSession(token);
          setStatus("success");
          setMessage("Your email has already been verified");
        } else {
          setStatus("error");
          setMessage(
            error.message ||
            "Unable to verify email. The token may be invalid or expired."
          );
        }
      }
    };

    // Start verification process
    verify();
  }, [token, verifyEmail]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email) return;

    setResending(true);
    try {
      await resendVerification(email);

      if (isMounted.current) {
        setStatus("resent");
        setMessage(
          "Verification email has been resent. Please check your inbox."
        );
      }
    } catch (error) {
      if (isMounted.current) {
        setMessage(error.message || "Failed to resend verification email");
      }
    } finally {
      if (isMounted.current) {
        setResending(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden">
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

      {/* Right Column: Status Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-20 bg-white overflow-y-auto">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="inline-block mb-12">
            <h1 className="font-jost text-4xl font-black text-[#144D53] tracking-tight">
              NUTRY<span className="text-[#E6A15A]">BITES</span>
            </h1>
          </Link>

          <ClientOnly fallback={<div className="py-8 text-slate-400 font-medium">Loading...</div>}>
            {(status === "initial" || status === "verifying") && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-[#1F6F78]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#1F6F78] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-jost font-bold text-slate-800 mb-2">Verifying Email</h2>
                <p className="text-slate-500">Please wait while we confirm your email address...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 scale-up-animation">
                  <DynamicIcon name="Check" className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-jost font-bold text-slate-800 mb-2">Success!</h2>
                <p className="text-slate-600 font-medium mb-4">{message}</p>
                <p className="text-sm text-slate-400 mb-8">
                  Redirecting to login in <span className="font-bold text-[#1F6F78]">{redirectCountdown}s</span>
                </p>
                <Link
                  href="/auth"
                  className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  Go to Login <DynamicIcon name="ArrowRight" className="h-5 w-5" />
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                  <DynamicIcon name="XCircle" className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-jost font-bold text-slate-800 mb-2">Verification Failed</h2>
                <p className="text-slate-600 mb-8">{message}</p>

                <div className="w-full space-y-4">
                  <form onSubmit={handleResendVerification} className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Try again with your email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#1F6F78] focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resending || !email}
                      className="w-full h-14 bg-[#1F6F78] text-white font-bold rounded-2xl hover:bg-[#144D53] disabled:bg-slate-300 transition-all shadow-md"
                    >
                      {resending ? "Sending..." : "Resend Verification Link"}
                    </button>
                  </form>

                  <Link href="/auth" className="block text-sm font-bold text-[#1F6F78] hover:underline">
                    Back to Registration
                  </Link>
                </div>
              </div>
            )}

            {status === "resent" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
                  <DynamicIcon name="Mail" className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-jost font-bold text-slate-800 mb-2">Email Sent!</h2>
                <p className="text-slate-600 mb-8">{message}</p>
                <Link
                  href="/auth"
                  className="w-full h-14 border-2 border-[#1F6F78] text-[#1F6F78] font-bold rounded-2xl hover:bg-[#1F6F78]/5 transition-all flex items-center justify-center"
                >
                  Back to Login
                </Link>
              </div>
            )}
          </ClientOnly>
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
        @keyframes scale-up {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-up-animation {
          animation: scale-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
