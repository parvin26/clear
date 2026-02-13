import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ActionPlan } from "@/lib/types";

interface ActionPlanTimelineProps {
  actionPlan: ActionPlan;
}

const sections: { key: keyof ActionPlan; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
];

export function ActionPlanTimeline({ actionPlan }: ActionPlanTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Plan Timeline</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.key} className="space-y-3 rounded-xl border border-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {section.label}
            </p>
            <ul className="space-y-2 text-sm text-ink-muted">
              {actionPlan[section.key].length === 0 && (
                <li className="text-ink-muted">No actions listed.</li>
              )}
              {actionPlan[section.key].map((item, idx) => (
                <li key={idx} className="rounded-lg bg-slate-50 p-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

