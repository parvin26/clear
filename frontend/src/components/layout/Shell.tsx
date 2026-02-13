"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  const marketingPages = [
    "/",
    "/how-it-works",
    "/who-we-help",
    "/why-exec-connect",
    "/cxos",
    "/case-studies",
    "/insights",
    "/ecosystem",
    "/get-started",
    "/about",
    "/book-call",
    "/book-diagnostic",
    "/diagnostic",
    "/governance",
    "/pricing",
    "/for-enterprises",
    "/for-founders",
    "/for-partners",
    "/for-institutions",
    "/guided-start",
    "/start",
    "/demo",
    "/contact",
    "/privacy",
    "/terms",
    "/security",
  ];

  const isMarketingPage =
    marketingPages.includes(pathname || "") ||
    pathname?.startsWith("/book-cxo") ||
    pathname?.startsWith("/cxos/") ||
    pathname?.startsWith("/diagnostic/") ||
    pathname?.startsWith("/demo/");

  if (isMarketingPage) {
    const isAboutPage = pathname === "/about";
    const isHomePage = pathname === "/";
    const mainClass = isAboutPage
      ? "flex-1 w-full overflow-x-hidden pt-[var(--header-height)]"
      : isHomePage
        ? "flex-1 w-full overflow-x-clip pt-[var(--header-height)]"
        : "flex-1 content-container overflow-x-clip pt-[var(--header-height)]";
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Topbar />
        <main className={mainClass}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 content-container pt-[var(--header-height)] py-6 md:py-8 w-full">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
