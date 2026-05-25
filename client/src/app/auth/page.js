"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { AuthRedirect } from "@/components/auth-redirect";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FiEye as Eye,
  FiEyeOff as EyeOff,
  FiMail as Mail,
  FiLock as Lock,
  FiLoader as Loader2,
} from "react-icons/fi";
import Image from "next/image";

const TABS = ["login", "register", "verify-otp"];
const NAV_TABS = ["login", "register"];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const { login, register, verifyOtp, resendVerification } = useAuth();

  const queryTab = (searchParams.get("tab") || "login").toLowerCase();
  const initialTab = TABS.includes(queryTab) ? queryTab : "login";
  const [activeTab, setActiveTab] = useState(initialTab);

  // OAuth: enabled providers from admin (Google, Facebook, etc.)
  const [enabledOAuthProviders, setEnabledOAuthProviders] = useState([]);

  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        const res = await fetch(`${base}/public/oauth-providers`, { credentials: "include" });
        const data = await res.json();
        if (data?.success && Array.isArray(data?.data?.providers)) {
          setEnabledOAuthProviders(data.data.providers);
        }
      } catch (_) {
        setEnabledOAuthProviders([]);
      }
    };
    fetchOAuthProviders();
  }, []);

  // Persist selected tab in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    const email = searchParams.get("email");
    if (email) params.set("email", email);
    const href = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", href);
  }, [activeTab, searchParams]);

  const emailFromQuery = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [pendingEmail, setPendingEmail] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem("pendingEmail") || localStorage.getItem("registeredEmail") || "";
    const chosen = emailFromQuery || stored;
    if (chosen) setPendingEmail(chosen);
  }, [emailFromQuery]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((x) => x - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Email and password are required");
      return;
    }
    setLoginSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      sessionStorage.setItem("justLoggedIn", "true");
      const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
      setTimeout(() => {
        window.location.href = returnUrl ? decodeURIComponent(returnUrl) : "/";
      }, 300);
    } catch (err) {
      const msg = err.message || "Login failed";
      if (msg.toLowerCase().includes("verify")) {
        toast.error("Please verify with OTP first");
        setActiveTab("verify-otp");
        if (loginEmail) {
          localStorage.setItem("pendingEmail", loginEmail);
          setPendingEmail(loginEmail);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  const getPasswordStrength = (pwd) => {
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

  const passwordStrength = getPasswordStrength(form.password);

  const isPasswordValid = () =>
    form.password.length >= 8 &&
    /[A-Z]/.test(form.password) &&
    /[a-z]/.test(form.password) &&
    /\d/.test(form.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(form.password) &&
    form.password === form.confirmPassword &&
    form.name.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const validateRegister = () => {
    if (form.name.trim().length < 3) return toast.error("Name should be at least 3 characters"), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Enter a valid email"), false;
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters long"), false;
    if (!/[A-Z]/.test(form.password)) return toast.error("Password must contain at least one uppercase letter"), false;
    if (!/[a-z]/.test(form.password)) return toast.error("Password must contain at least one lowercase letter"), false;
    if (!/\d/.test(form.password)) return toast.error("Password must contain at least one number"), false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return toast.error("Password must contain at least one special character"), false;
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match"), false;
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setRegisterSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        referralCode: form.referralCode?.trim() || undefined,
      });
      localStorage.setItem("pendingEmail", form.email);
      toast.success("Account created. Enter the OTP sent to your email.");
      setActiveTab("verify-otp");
      setPendingEmail(form.email);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const otpString = otp.join("");
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingEmail) return toast.error("Email required");
    if (!/^\d{6}$/.test(otpString)) return toast.error("Enter 6-digit OTP");
    setVerifySubmitting(true);
    try {
      await verifyOtp(pendingEmail, otpString);
      toast.success("Email verified. Please login.");
      setActiveTab("login");
    } catch (err) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setVerifySubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return toast.error("Enter your email to resend OTP");
    try {
      await resendVerification(pendingEmail);
      toast.success("OTP sent to your email");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    if (index === 5 && value && newOtp.every((d) => d !== "")) {
      const fullOtp = newOtp.join("");
      if (/^\d{6}$/.test(fullOtp) && pendingEmail && !verifySubmitting) {
        setVerifySubmitting(true);
        verifyOtp(pendingEmail, fullOtp)
          .then(() => {
            toast.success("Email verified. Please login.");
            setActiveTab("login");
          })
          .catch((err) => toast.error(err.message || "Failed to verify OTP"))
          .finally(() => setVerifySubmitting(false));
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };



  return (
    <AuthRedirect>
      <div className="fixed inset-0 z-[100] flex bg-white overflow-hidden">
        <Toaster position="top-center" richColors />

        {/* Left Column: Visual Banner (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#144D53] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              width={1920}
              height={1080}
              src="/login.png"
              alt="Healthy snacks"
              className="w-full h-full object-cover scale-105 animate-subtle-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#144D53] via-[#144D53]/20 to-transparent" />
          </div>


        </div>

        {/* Right Column: Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center p-5 lg:p-10 bg-white overflow-y-auto min-h-0">
          <div className="w-full max-w-md my-auto py-6">
            {/* Logo/Header */}
            <div className="mb-4 text-center lg:text-left">
              <Link href="/" className="inline-block mb-3">
                <h1 className="font-jost text-4xl font-black text-[#144D53] tracking-tight">
                  NUTRY<span className="text-[#E6A15A]">BITES</span>
                </h1>
              </Link>
              <h2 className="text-2xl font-jost font-bold text-slate-800">
                {activeTab === "login" && "Welcome Back!"}
                {activeTab === "register" && "Create Account"}
                {activeTab === "verify-otp" && "Verify Email"}
              </h2>
              <p className="text-slate-500 mt-2">
                {activeTab === "login" && "Enter your details to access your account."}
                {activeTab === "register" && "Sign up and start your healthy snacking journey."}
                {activeTab === "verify-otp" && "We've sent a 6-digit code to your email."}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-8">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab
                    ? "bg-white text-[#1F6F78] shadow-md scale-[1.02]"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {tab === "login" && "Sign In"}
                  {tab === "register" && "Sign Up"}
                </button>
              ))}
              {activeTab === "verify-otp" && (
                <div className="flex-1 py-3 rounded-xl bg-[#E6A15A]/20 text-[#d8934a] text-sm font-bold text-center">
                  Verify OTP
                </div>
              )}
            </div>

            {/* Forms */}
            <div className="mt-4">
              {activeTab === "login" && (
                <form className="space-y-6" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-12 h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-2xl"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      <Link href="/forgot-password" size="sm" className="text-xs font-bold text-[#1F6F78] hover:text-[#144D53] transition-colors">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-2xl"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F6F78] transition-colors"
                        onClick={() => setShowLoginPassword((s) => !s)}
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#1F6F78]/20 transition-all active:scale-[0.98]"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              )}

              {activeTab === "register" && (
                <form className="space-y-2" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                          className="h-14 pr-12 bg-slate-50/50 border-slate-200 rounded-2xl"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F6F78] transition-colors"
                          onClick={() => setShowRegisterPassword((s) => !s)}
                        >
                          {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {form.password && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"}`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-semibold ml-1 ${passwordStrength.label === "Weak" ? "text-red-500" : passwordStrength.label === "Medium" ? "text-yellow-500" : "text-green-600"}`}>
                            {passwordStrength.label} — use uppercase, number & special char
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className="h-14 pr-12 bg-slate-50/50 border-slate-200 rounded-2xl"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F6F78] transition-colors"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl shadow-lg mt-4"
                    disabled={registerSubmitting || !form.name.trim() || !form.email || form.password.length < 8 || form.password !== form.confirmPassword}
                  >
                    {registerSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              )}

              {activeTab === "verify-otp" && (
                <form className="space-y-8" onSubmit={handleVerify}>
                  <div className="space-y-4 text-center">
                    <p className="text-slate-600">Enter the verification code sent to <span className="font-bold text-[#144D53]">{pendingEmail}</span></p>
                    <div className="flex gap-2 justify-center">
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
                          className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-300 bg-slate-100 rounded-2xl focus:border-[#1F6F78] focus:bg-white outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full h-14 bg-[#1F6F78] hover:bg-[#144D53] text-white font-bold text-lg rounded-2xl"
                      disabled={verifySubmitting}
                    >
                      {verifySubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify & Continue"}
                    </Button>
                    <div className="text-center">
                      {resendCooldown > 0 ? (
                        <p className="text-sm text-slate-400">Resend OTP in <span className="font-bold text-[#1F6F78]">{resendCooldown}s</span></p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="text-sm font-bold text-[#1F6F78] hover:text-[#144D53] transition-colors"
                        >
                          Didn&apos;t receive code? Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-slate-400 text-xs">
                By continuing, you agree to our <br />
                <Link href="/terms" className="text-slate-600 underline font-medium">Terms of Service</Link> and <Link href="/privacy" className="text-slate-600 underline font-medium">Privacy Policy</Link>
              </p>
            </div>
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
    </AuthRedirect>
  );
}
