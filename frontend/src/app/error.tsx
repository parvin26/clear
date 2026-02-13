"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError({
      message: error.message,
      stack: error.stack,
      path: typeof window !== "undefined" ? window.location?.pathname : undefined,
    });
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-lg font-semibold text-ink mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-sm mb-4 max-w-md">
        We’ve recorded the error. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
