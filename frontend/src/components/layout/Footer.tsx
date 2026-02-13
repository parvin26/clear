"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const marketingFooterRequiredLinks = [
  { href: "/governance", label: "Governance" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-partners", label: "For partners" },
  { href: "/for-institutions", label: "Institutions" },
  { href: "/start", label: "Get started" },
  { href: "/contact", label: "Contact" },
];

const marketingFooterLinks = [
  { href: "/about", label: "About" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/security", label: "Security" },
];

const appFooterLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Help" },
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
  "/contact",
  "/privacy",
  "/terms",
  "/security",
];

function isAppPage(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return false;
  if (marketingPages.includes(pathname)) return false;
  if (
    pathname.startsWith("/book-cxo") ||
    pathname.startsWith("/cxos/") ||
    pathname.startsWith("/diagnostic/")
  )
    return false;
  return true;
}

function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#111827] text-white pt-20">
      <div className="max-w-[1120px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">
          <div className="space-y-6">
            <div className="text-xl font-bold tracking-tight text-white">CLEAR Commons</div>
            <div className="space-y-4">
              <p className="text-white/60 text-sm leading-relaxed max-w-[260px]">
                Giving founders and capital providers a repeatable way to diagnose issues, agree a plan, and track execution.
              </p>
              <p className="text-white/40 text-xs font-medium">Part of the Be Noor ecosystem</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/who-we-help" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Use cases
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/governance" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Governance
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/for-partners" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  For partners
                </Link>
              </li>
              <li>
                <Link href="/start" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Legal & Contact</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <a href="mailto:hello@clearcommons.com" className="text-white/75 hover:text-white text-[14px] transition-colors">
                  hello@clearcommons.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-white/10 mt-12">
        <div className="max-w-[1120px] mx-auto px-6 md:px-12 lg:px-24 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <div>&copy; {currentYear} CLEAR Commons.</div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/governance" className="hover:text-white/60 transition-colors">Governance</Link>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/for-partners" className="hover:text-white/60 transition-colors">For partners</Link>
            <Link href="/start" className="hover:text-white/60 transition-colors">Get started</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const pathname = usePathname();
  const showAppFooter = isAppPage(pathname);

  if (showAppFooter) {
    return (
      <footer className="border-t border-border bg-surface">
        <div className="content-container py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-semibold text-ink">DecisionFlow</span>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
              {appFooterLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    );
  }

  return <MarketingFooter />;
}
