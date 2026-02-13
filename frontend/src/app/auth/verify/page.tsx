"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { verifyMagicLink, setAuthToken } from "@/lib/clear-api";

const PRIMARY_HEX = "#1F4FD8";

function AuthVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const next = searchParams.get("next") || searchParams.get("return");
    const redirectTo =
      next && typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/dashboard";
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid link. Missing token or email.");
      return;
    }
    verifyMagicLink(token, email)
      .then((res) => {
        setAuthToken(res.access_token);
        setStatus("success");
        setMessage("You’re signed in. Redirecting…");
        setTimeout(() => router.replace(redirectTo), 1500);
      })
      .catch(() => {
        setStatus("error");
        setMessage("This link is invalid or has expired.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-[400px] rounded-[16px] bg-white border border-slate-200 shadow-lg p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-bold"
            style={{ borderColor: PRIMARY_HEX, color: PRIMARY_HEX }}
          >
            C
          </div>
          <span className="text-xl font-semibold tracking-tight uppercase" style={{ color: PRIMARY_HEX }}>
            CLEAR
          </span>
        </div>
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-400 mb-4" aria-hidden />
            <p className="text-slate-600">Signing you in…</p>
          </>
        )}
        {status === "success" && (
          <p className="text-slate-600">{message}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-600 mb-4">{message}</p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: PRIMARY_HEX }}
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" aria-hidden />
      </div>
    }>
      <AuthVerifyContent />
    </Suspense>
  );
}
