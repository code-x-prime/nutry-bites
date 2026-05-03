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
  FiUser as User,
  FiPhone as Phone,
  FiLoader as Loader2,
} from "react-icons/fi";

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
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOAuthLogin = (provider) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "/";
    window.location.href = `${base}/auth/${provider}?redirect=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 py-8 px-4">
        <Toaster position="top-center" richColors />
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1F6F78] to-[#1a7a68] px-8 py-6 text-white">
              <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
              <p className="text-emerald-100/90 text-sm mt-1">
                {activeTab === "login" && "Sign in to your account"}
                {activeTab === "register" && "Create your account"}
                {activeTab === "verify-otp" && "Verify your email"}
              </p>
            </div>

            <div className="p-8">
              {/* Tab switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
                {NAV_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                      ? "bg-white text-[#1F6F78] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {tab === "login" && "Login"}
                    {tab === "register" && "Register"}
                  </button>
                ))}
                {activeTab === "verify-otp" && (
                  <div className="flex-1 py-2.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold text-center">
                    Verify OTP
                  </div>
                )}
              </div>

              {/* OAuth buttons - show only when enabled */}
              {enabledOAuthProviders.length > 0 && activeTab !== "verify-otp" && (
                <div className="space-y-3 mb-6">
                  {enabledOAuthProviders.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-slate-200 hover:bg-slate-50 text-black hover:text-black"
                      onClick={() => handleOAuthLogin(p)}
                    >
                      {p === "google" && (
                        <>
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Continue with Google
                        </>
                      )}
                      {p === "facebook" && "Continue with Facebook"}
                      {p === "twitter" && "Continue with Twitter"}
                    </Button>
                  ))}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-500">or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "login" && (
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-11"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <Link href="/forgot-password" className="text-sm text-[#1F6F78] hover:underline">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowLoginPassword((s) => !s)}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#1F6F78] hover:bg-[#125043]"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
                  </Button>
                  <p className="text-center text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <button type="button" className="text-[#1F6F78] font-medium hover:underline" onClick={() => setActiveTab("register")}>
                      Register
                    </button>
                  </p>
                </form>
              )}

              {activeTab === "register" && (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="pl-10 h-11"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        className="pl-10 h-11"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className="pl-10 h-11"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        className="pl-10 pr-10 h-11"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowRegisterPassword((s) => !s)}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.password.length > 0 && (
                      <ul className="mt-2 text-xs text-slate-500 space-y-1">
                        {[
                          [form.password.length >= 8, "8+ characters"],
                          [/[A-Z]/.test(form.password), "One uppercase"],
                          [/[a-z]/.test(form.password), "One lowercase"],
                          [/\d/.test(form.password), "One number"],
                          [/[!@#$%^&*(),.?":{}|<>]/.test(form.password), "One special char"],
                        ].map(([ok, label], i) => (
                          <li key={i} className={`flex items-center gap-1.5 ${ok ? "text-emerald-600" : ""}`}>
                            <span>{ok ? "✓" : "○"}</span> {label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                    <Input
                      type={showRegisterPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="h-11"
                      placeholder="••••••••"
                      required
                    />
                    {form.confirmPassword && (
                      <p className={`mt-1 text-xs ${form.password === form.confirmPassword ? "text-emerald-600" : "text-red-600"}`}>
                        {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Referral Code (optional)</label>
                    <Input
                      value={form.referralCode}
                      onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                      className="h-11 uppercase"
                      placeholder="ABC123"
                    />
                  </div> */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#1F6F78] hover:bg-[#125043]"
                    disabled={registerSubmitting || !isPasswordValid()}
                  >
                    {registerSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <button type="button" className="text-[#1F6F78] font-medium hover:underline" onClick={() => setActiveTab("login")}>
                      Login
                    </button>
                  </p>
                </form>
              )}

              {activeTab === "verify-otp" && (
                <form className="space-y-6" onSubmit={handleVerify}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={pendingEmail}
                        onChange={(e) => setPendingEmail(e.target.value)}
                        className="pl-10 h-11"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Enter 6-digit OTP</label>
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
                          className="w-12 h-14 text-center text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-[#1F6F78] focus:ring-2 focus:ring-[#1F6F78]/20 outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </Button>
                    <Button type="submit" className="flex-1 h-11 bg-[#1F6F78] hover:bg-[#125043]" disabled={verifySubmitting}>
                      {verifySubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  <p className="text-center text-sm text-slate-600">
                    Already verified?{" "}
                    <button type="button" className="text-[#1F6F78] font-medium hover:underline" onClick={() => setActiveTab("login")}>
                      Login
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </AuthRedirect>
  );
}
