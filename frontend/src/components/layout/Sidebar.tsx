"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, History, MessageCircle, TrendingUp, Users, Settings, Code, Scale, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  
  // Determine which agent section we're in
  const getNavItems = () => {
    if (pathname?.startsWith("/institutional")) {
      return [
        { href: "/institutional/portfolios", label: "Portfolios", icon: Briefcase },
        { href: "/institutional/cohorts", label: "Cohorts", icon: Users },
        { href: "/institutional/cohort-activation", label: "Cohort activation", icon: Users },
      ];
    }
    if (pathname?.startsWith("/advisor")) {
      return [
        { href: "/advisor", label: "Advisor home", icon: FileText },
        { href: "/advisor/enterprises", label: "Your enterprises", icon: Users },
      ];
    }
    if (pathname?.startsWith("/decisions")) {
      return [
        { href: "/decisions", label: "Decision list", icon: FileText },
        { href: "/decisions/new", label: "New decision", icon: FileText },
      ];
    }
    if (pathname?.startsWith("/cfo")) {
      return [
        { href: "/cfo/diagnostic", label: "CFO Diagnostic", icon: FileText },
        { href: "/cfo/history", label: "Analyses History", icon: History },
        { href: "/cfo/chat", label: "Finance Chat", icon: MessageCircle },
      ];
    } else if (pathname?.startsWith("/cmo")) {
      return [
        { href: "/cmo/diagnostic", label: "CMO Diagnostic", icon: FileText },
        { href: "/cmo/analysis", label: "Analyses History", icon: History },
        { href: "/cmo/chat", label: "Growth Chat", icon: MessageCircle },
      ];
    } else if (pathname?.startsWith("/coo")) {
      return [
        { href: "/coo/diagnostic", label: "COO Diagnostic", icon: FileText },
        { href: "/coo/analysis", label: "Analyses History", icon: History },
        { href: "/coo/chat", label: "Ops Chat", icon: MessageCircle },
      ];
    } else if (pathname?.startsWith("/cto")) {
      return [
        { href: "/cto/diagnostic", label: "CTO Diagnostic", icon: FileText },
        { href: "/cto/analysis", label: "Analyses History", icon: History },
        { href: "/cto/chat", label: "Tech Chat", icon: MessageCircle },
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const agentLinks = [
    { href: "/decisions", label: "Decision Workspace", icon: Scale, color: "from-slate-600 to-slate-800" },
    { href: "/institutional/portfolios", label: "Portfolios", icon: Briefcase, color: "from-slate-600 to-slate-800" },
    { href: "/advisor", label: "Advisor", icon: Users, color: "from-violet-600 to-purple-800" },
    { href: "/cfo", label: "Finance", icon: TrendingUp, color: "from-blue-500 to-indigo-600" },
    { href: "/cmo", label: "Growth", icon: Users, color: "from-purple-500 to-pink-600" },
    { href: "/coo", label: "Ops", icon: Settings, color: "from-green-500 to-teal-600" },
    { href: "/cto", label: "Tech", icon: Code, color: "from-orange-500 to-red-600" },
  ];

  if (navItems.length === 0) {
    // Show agent selection on home / dashboard
    return (
      <aside className="w-64 bg-surface/95 backdrop-blur-xl border-r border-border min-h-[calc(100vh-73px)] shadow-lg">
        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
              pathname === "/dashboard" ? "bg-primary text-white" : "hover:bg-muted text-ink-muted"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </Link>
          <div className="pt-4 border-t border-border">
            <p className="px-4 py-2 text-xs font-semibold text-ink-muted uppercase tracking-wider">Decision areas</p>
            {agentLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg",
                    isActive
                      ? "bg-primary text-white"
                      : "text-ink-muted hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }

  // Show agent-specific navigation
  return (
    <aside className="w-64 bg-surface border-r border-border min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-1">
        <Link 
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted mb-4"
        >
          <LayoutDashboard className="w-5 h-5 text-ink-muted" />
          <span className="font-medium text-ink-muted">Home</span>
        </Link>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                isActive
                  ? "bg-primary text-white"
                  : "text-ink-muted hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
