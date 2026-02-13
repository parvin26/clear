"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/clear-api";

const productNavItems = [
  { href: "/how-it-works", label: "How CLEAR Works" },
];

const solutionsNavItems = [
  { href: "/for-enterprises", label: "Enterprises" },
  { href: "/for-founders", label: "Founders" },
  { href: "/for-partners", label: "For Partners" },
  { href: "/for-institutions", label: "Institutions" },
];

const proofNavItems = [
  { href: "/case-studies", label: "Case Studies" },
];

const companyNavItems = [
  { href: "/about", label: "About" },
  { href: "/governance", label: "Governance" },
];

const appNavItemsBase = [
  { href: "/dashboard", label: "Workspace" },
  { href: "/decisions", label: "My Decisions" },
  { href: "/resources", label: "Reports" },
];

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
  "/login",
  "/signup",
  "/governance",
  "/pricing",
  "/for-enterprises",
  "/for-founders",
  "/for-partners",
  "/for-institutions",
  "/guided-start",
  "/start",
];

function isAppPage(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return false;
  if (marketingPages.includes(pathname)) return false;
  if (pathname.startsWith("/book-cxo") || pathname.startsWith("/cxos/") || pathname.startsWith("/diagnostic/")) return false;
  return true;
}

function NavDropdown({
  label,
  items,
  pathname,
  onClose,
}: {
  label: string;
  items: { href: string; label: string }[];
  pathname: string | null;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = items.some((i) => pathname === i.href);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          isActive ? "text-ink" : "text-ink-muted hover:text-ink"
        )}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 min-w-[160px]">
          <div className="rounded-lg border border-border bg-surface shadow-lg py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-ink-muted hover:text-ink hover:bg-muted"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPortfoliosNav, setShowPortfoliosNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showAppHeader = isAppPage(pathname);

  useEffect(() => {
    setShowPortfoliosNav(isAuthenticated());
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const appNavItems = [
    ...appNavItemsBase,
    ...(showPortfoliosNav ? [{ href: "/institutional/portfolios", label: "Portfolios" }] : []),
  ];

  if (showAppHeader) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-border bg-white transition-shadow duration-200",
          scrolled ? "shadow-[0_2px_8px_rgba(31,42,55,0.08)]" : "shadow-[0_1px_3px_rgba(31,42,55,0.06)]"
        )}
      >
        <div className="content-container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/" className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
                CLEAR
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
                <span className="font-semibold text-lg text-ink">DecisionFlow</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {appNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
                      ? "text-ink"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button size="sm" variant="secondary" className="text-ink" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/start">Get started</Link>
              </Button>
            </div>

            <button
              type="button"
              className="md:hidden p-3 -m-1 rounded-lg hover:bg-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-ink" /> : <Menu className="w-6 h-6 text-ink" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 bg-white">
              <nav className="flex flex-col gap-1">
                <Link href="/" className="px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  CLEAR (landing)
                </Link>
                {appNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border mt-2 flex flex-col gap-2">
                  <Link href="/login" className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  <Link
                    href="/start"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 px-4 rounded-lg text-center text-sm font-semibold bg-primary text-white hover:bg-primary/90"
                  >
                    Get started
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "border-b border-border bg-white sticky top-0 z-50 transition-shadow duration-200",
        scrolled ? "shadow-[0_2px_8px_rgba(31,42,55,0.08)]" : "shadow-sm"
      )}
    >
      <div className="content-container py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CLEAR Commons" width={140} height={36} className="h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavDropdown label="Product" items={productNavItems} pathname={pathname} onClose={() => {}} />
            <NavDropdown label="Solutions" items={solutionsNavItems} pathname={pathname} onClose={() => {}} />
            <NavDropdown label="Proof" items={proofNavItems} pathname={pathname} onClose={() => {}} />
            <NavDropdown label="Company" items={companyNavItems} pathname={pathname} onClose={() => {}} />
            <Link
              href="/pricing"
              className={cn("text-sm transition-colors", pathname === "/pricing" ? "text-ink" : "text-ink-muted hover:text-ink")}
            >
              Pricing
            </Link>
            <Link
              href="/start"
              className={cn("text-sm transition-colors", pathname === "/start" ? "text-ink" : "text-ink-muted hover:text-ink")}
            >
              Get started
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" variant="secondary" className="text-ink" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/start">Get started</Link>
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden p-3 -m-1 rounded-lg hover:bg-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-ink" /> : <Menu className="w-6 h-6 text-ink" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 bg-white shadow-lg">
            <nav className="flex flex-col gap-1">
              <p className="px-4 py-2 text-xs font-semibold text-ink-muted uppercase">Product</p>
              {productNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <p className="px-4 py-2 text-xs font-semibold text-ink-muted uppercase mt-2">Solutions</p>
              {solutionsNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <p className="px-4 py-2 text-xs font-semibold text-ink-muted uppercase mt-2">Proof</p>
              {proofNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <p className="px-4 py-2 text-xs font-semibold text-ink-muted uppercase mt-2">Company</p>
              {companyNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <Link href="/pricing" className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/start" className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Get started
              </Link>
              <div className="pt-4 border-t border-border mt-2 flex flex-col gap-2">
                <Link href="/login" className="px-4 py-3 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/start"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 px-4 rounded-lg text-center text-sm font-semibold bg-primary text-white hover:bg-primary/90"
                >
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
