"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { login, sendMagicLink, setAuthToken } from "@/lib/clear-api";

const BRAND_COLOR = "#1D4ED8";

function isValidEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function sanitizeNext(next: string | null): string | null {
  if (!next || typeof next !== "string") return null;
  const trimmed = next.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("http")) return null;
  if (trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(
    () => sanitizeNext(searchParams.get("next") ?? searchParams.get("return")),
    [searchParams]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const next: { email?: string; password?: string } = {};
      if (!email.trim()) next.email = "Invalid email";
      else if (!isValidEmail(email)) next.email = "Invalid email";
      if (!password.trim()) next.password = "Password cannot be empty.";
      if (Object.keys(next).length > 0) {
        setErrors(next);
        return;
      }
      setErrors({});
      setIsSubmitting(true);
      try {
        const res = await login({ email: email.trim(), password });
        setAuthToken(res.access_token);
        router.push(nextUrl || "/dashboard");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Invalid email or password.";
        setErrors({ password: msg });
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, router, nextUrl]
  );

  const onSendMagicLink = useCallback(async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: "Enter a valid email." });
      return;
    }
    setErrors({});
    setSendingMagicLink(true);
    try {
      await sendMagicLink(email.trim());
      setMagicLinkSent(true);
    } catch {
      setErrors({ email: "Failed to send link. Try again." });
    } finally {
      setSendingMagicLink(false);
    }
  }, [email]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-16 bg-background">
      <div className="w-full max-w-[1300px] flex flex-col md:flex-row min-h-[85vh] md:min-h-[82vh] rounded-[16px] overflow-hidden bg-surface border border-border shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="w-full md:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-10">
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-bold shrink-0"
              style={{ borderColor: BRAND_COLOR, color: BRAND_COLOR }}
            >
              C
            </div>
            <span className="text-xl font-semibold tracking-tight uppercase" style={{ color: BRAND_COLOR }}>
              CLEAR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-2 mb-2">Log in to CLEAR</h1>
          <p className="text-ink-muted text-sm sm:text-base mb-8">Welcome back. Please sign in to continue.</p>
          <p className="text-ink-muted text-sm mb-6">Use your work email to access your CLEAR workspace.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-ink font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-12 pl-10 pr-4 rounded-lg border text-base", errors.email ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-primary")}
                  style={{ paddingLeft: "2.5rem" }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                />
              </div>
              {errors.email && <p id="login-email-error" className="text-sm text-red-600" role="alert" aria-live="polite">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-ink font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("h-12 pl-10 pr-24 rounded-lg border text-base", errors.password ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-primary")}
                  style={{ paddingLeft: "2.5rem" }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-1" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p id="login-password-error" className="text-sm text-red-600" role="alert" aria-live="polite">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full h-12 rounded-lg text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" style={{ backgroundColor: BRAND_COLOR }} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden />Logging in…</> : "Login"}
            </Button>
          </form>

          {magicLinkSent ? (
            <p className="mt-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Check your email. We sent a sign-in link to <strong>{email}</strong>. Click it to sign in.
            </p>
          ) : (
            <div className="mt-6">
              <button type="button" className="text-sm font-medium w-full text-left py-2" style={{ color: BRAND_COLOR }} onClick={onSendMagicLink} disabled={sendingMagicLink}>
                {sendingMagicLink ? "Sending…" : "Email me a sign-in link instead"}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm">
            <p className="text-ink-muted">
              <Link href="/forgot-password" className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded" style={{ color: BRAND_COLOR }}>Forgot your password?</Link>
            </p>
            <p className="text-ink-muted">
              New to CLEAR?{" "}
              <Link href="/signup" className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded" style={{ color: BRAND_COLOR }}>Create an account</Link>
            </p>
          </div>
        </div>
        <div className="relative hidden sm:flex w-full md:w-[58%] min-h-[40vh] md:min-h-0 flex-col justify-end bg-ink overflow-hidden" aria-hidden>
          <div className="absolute inset-0 opacity-90" style={{ background: "linear-gradient(135deg, rgba(28, 195, 176, 0.25) 0%, rgba(31, 79, 216, 0.35) 50%, rgba(15, 23, 42, 0.6) 100%)" }} />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="absolute inset-y-0 left-0 w-32 md:w-40 bg-gradient-to-r from-white to-transparent opacity-20 pointer-events-none" aria-hidden />
          <div className="relative p-6 md:p-8 text-white/90 max-w-sm">
            <p className="text-sm font-medium tracking-wide">Real-time clarity for your cashflow</p>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">Track, forecast, and manage your business finances in one secure workspace.</p>
          </div>
        </div>
      </div>
      <footer className="mt-6 text-center text-sm text-ink-muted">© {currentYear} CLEAR. All rights reserved.</footer>
    </div>
  );
}
