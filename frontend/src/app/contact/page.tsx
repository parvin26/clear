"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Contact is formalized as the book-call form.
 * Redirect so one form serves both /contact and /book-call.
 */
export default function ContactPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/book-call");
  }, [router]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-ink-muted">
      Redirecting to contact form…
    </div>
  );
}
