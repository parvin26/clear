"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/clear-api";

/**
 * Redirects unauthenticated users from any /institutional/* route to login
 * with return URL so they can be sent back after signing in.
 */
export function InstitutionalGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated()) {
      setAllowed(true);
      return;
    }
    const returnPath = pathname || "/institutional/portfolios";
    const next = encodeURIComponent(returnPath);
    router.replace(`/login?next=${next}`);
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-ink-muted">Redirecting to login…</div>
      </div>
    );
  }

  return <>{children}</>;
}
