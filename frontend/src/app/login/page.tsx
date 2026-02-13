"use client";

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

const BRAND_COLOR = "#1D4ED8";

function LoginFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-16 bg-background">
      <div className="w-full max-w-[1300px] flex flex-col md:flex-row min-h-[85vh] md:min-h-[82vh] rounded-[16px] overflow-hidden bg-surface border border-border shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="w-full md:w-[42%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 md:py-16">
          <div className="w-9 h-9 rounded-full border-2 shrink-0 animate-pulse bg-muted" style={{ borderColor: BRAND_COLOR }} />
          <div className="h-8 w-48 mt-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 mt-2 rounded bg-muted animate-pulse" />
          <div className="h-12 w-full mt-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 w-full mt-4 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 w-full mt-6 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="relative hidden sm:flex w-full md:w-[58%] min-h-[40vh] md:min-h-0 bg-ink" />
      </div>
      <footer className="mt-6 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} CLEAR. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
