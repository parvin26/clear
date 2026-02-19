"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ROLE_OPTIONS } from "@/lib/intake-constants";
import type { Role } from "@/lib/intake-types";
import { ROLES_WITH_DIAGNOSTIC_RUN } from "@/lib/intake-types";
import { Building2, Sparkles, Heart, Lightbulb, Wallet, HelpCircle } from "lucide-react";

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  msme_owner: Building2,
  startup_founder: Sparkles,
  social_enterprise_leader: Heart,
  aspiring_entrepreneur: Lightbulb,
  impact_investor: Wallet,
};

/** Roles that have a full intake flow (diagnostic run or investor profile). */
const ROLES_WITH_INTAKE_FLOW: Role[] = [...ROLES_WITH_DIAGNOSTIC_RUN, "impact_investor"];

interface StepRoleSelectProps {
  value: Role | null;
  onChange: (role: Role) => void;
}

export function StepRoleSelect({ value, onChange }: StepRoleSelectProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">Who are you?</h2>
      <p className="text-sm text-ink-muted">
        Choose the path that fits you. We&apos;ll tailor the diagnostic accordingly.
      </p>
      <span
        title="Choose Social Enterprise if you have an explicit impact mission and need to report on it to funders or partners. Otherwise, pick the option that best matches your current stage (e.g. MSME for an existing business, Startup Founder for a new venture)."
        className="text-xs text-primary hover:underline inline-flex items-center gap-1 cursor-help"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        Not sure which to choose?
      </span>

      <div className="grid gap-3">
        {ROLE_OPTIONS.map((opt) => {
          const Icon = ROLE_ICONS[opt.value];
          const supported = ROLES_WITH_INTAKE_FLOW.includes(opt.value);
          return (
            <Card
              key={opt.value}
              className={`overflow-hidden cursor-pointer transition-colors ${
                value === opt.value
                  ? "border-2 border-primary bg-primary/5"
                  : "border hover:border-primary/30"
              } ${!supported ? "opacity-80" : ""}`}
              onClick={() => supported && onChange(opt.value)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-5 w-5 text-primary" aria-hidden />}
                  <span className="text-lg font-medium">{opt.label}</span>
                </div>
                <p className="text-sm text-ink-muted font-normal">{opt.description}</p>
              </CardHeader>
              {!supported && (
                <CardContent className="pt-0">
                  <p className="text-xs text-ink-muted">Coming soon</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
