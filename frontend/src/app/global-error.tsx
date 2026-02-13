"use client";

import { useEffect } from "react";

/** Root-level error boundary. Logs to backend then renders fallback (must replace root layout). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000";
    const token =
      typeof localStorage !== "undefined" ? localStorage.getItem("clear_access_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/api/telemetry/errors`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        path: typeof window !== "undefined" ? window.location?.pathname : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased font-sans p-6 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-semibold text-ink mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-4 max-w-md text-center">
          We’ve recorded the error. Please refresh or try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
