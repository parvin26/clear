"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sendSignupOtp, register, setAuthToken } from "@/lib/clear-api";

const PRIMARY_HEX = "#1F4FD8";

function isValidEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type Step = "email" | "otp_password";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string }>({});

  const handleSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) {
        setErrors({ email: "Enter your email." });
        return;
      }
      if (!isValidEmail(email)) {
        setErrors({ email: "Invalid email." });
        return;
      }
      setErrors({});
      setSendingOtp(true);
      try {
        await sendSignupOtp(email.trim());
        setStep("otp_password");
        setResendCooldown(60);
        const id = setInterval(() => {
          setResendCooldown((c) => {
            if (c <= 1) {
              clearInterval(id);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number; data?: { detail?: string } } };
        const status = ax?.response?.status;
        const detail = ax?.response?.data?.detail;
        const msg =
          status === 404
            ? "Registration service unavailable. Is the backend running at the configured API URL?"
            : (detail || "Failed to send code.");
        setErrors({ email: msg });
      } finally {
        setSendingOtp(false);
      }
    },
    [email]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const next: { otp?: string; password?: string } = {};
      if (!otp.trim() || otp.trim().length !== 6) next.otp = "Enter the 6-digit code.";
      if (!password.trim()) next.password = "Password cannot be empty.";
      if (password.length < 8) next.password = "Password must be at least 8 characters.";
      if (Object.keys(next).length > 0) {
        setErrors(next);
        return;
      }
      setErrors({});
      setSubmitting(true);
      try {
        const res = await register({
          email: email.trim(),
          otp: otp.trim(),
          password,
          name: name.trim() || undefined,
        });
        setAuthToken(res.access_token);
        router.push("/dashboard");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed.";
        setErrors({ otp: msg });
      } finally {
        setSubmitting(false);
      }
    },
    [email, otp, password, name, router]
  );

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-16 bg-slate-100">
      <div className="w-full max-w-[500px] rounded-[16px] overflow-hidden bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8">
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-bold shrink-0"
            style={{ borderColor: PRIMARY_HEX, color: PRIMARY_HEX }}
          >
            C
          </div>
          <span className="text-xl font-semibold tracking-tight uppercase" style={{ color: PRIMARY_HEX }}>
            CLEAR
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Create your CLEAR account</h1>
        <p className="text-slate-500 text-sm mb-6">
          We’ll send a verification code to your email. Then set a password.
        </p>

        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-12 pl-10 rounded-lg border text-base",
                    errors.email ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"
                  )}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p id="signup-email-error" className="text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.email}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-12 rounded-lg font-semibold" style={{ backgroundColor: PRIMARY_HEX }} disabled={sendingOtp}>
              {sendingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send verification code"}
            </Button>
          </form>
        )}

        {step === "otp_password" && (
          <form onSubmit={handleRegister} className="space-y-5">
            <p className="text-sm text-slate-600">Code sent to <strong>{email}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="signup-otp">Verification code</Label>
              <Input
                id="signup-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={cn(
                  "h-12 rounded-lg border text-base font-mono text-lg",
                  errors.otp ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"
                )}
                aria-invalid={!!errors.otp}
              />
              {errors.otp && (
                <p className="text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.otp}
                </p>
              )}
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-500">Resend code in {resendCooldown}s</p>
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium"
                  style={{ color: PRIMARY_HEX }}
                  onClick={() => {
                    setResendCooldown(60);
                    sendSignupOtp(email.trim()).catch(() => setErrors({ otp: "Failed to resend." }));
                  }}
                >
                  Resend code
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name (optional)</Label>
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-lg border border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-12 pl-10 pr-20 rounded-lg border text-base",
                    errors.password ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"
                  )}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600" role="alert" aria-live="polite">
                  {errors.password}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-12 rounded-lg font-semibold" style={{ backgroundColor: PRIMARY_HEX }} disabled={submitting}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: PRIMARY_HEX }}>
            Sign in
          </Link>
        </p>
      </div>
      <footer className="mt-6 text-center text-sm text-slate-500">
        © {currentYear} CLEAR. All rights reserved.
      </footer>
    </div>
  );
}
