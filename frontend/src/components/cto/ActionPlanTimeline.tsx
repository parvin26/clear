"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionPlan } from "@/lib/types-cto";
import { Calendar, Clock } from "lucide-react";

interface ActionPlanTimelineProps {
  actionPlan: ActionPlan;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

export function ActionPlanTimeline({ actionPlan }: ActionPlanTimelineProps) {
  const hasActions =
    actionPlan.week.length > 0 ||
    actionPlan.month.length > 0 ||
    actionPlan.quarter.length > 0;

  if (!hasActions) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Action Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {actionPlan.week.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Clock className="h-4 w-4" />
                Immediate Actions (Next 1-2 Weeks)
              </h3>
              <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                {actionPlan.week.map((action, index) => (
                  <div key={index} className="pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {actionPlan.month.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Clock className="h-4 w-4" />
                Short-term Actions (Next Month)
              </h3>
              <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                {actionPlan.month.map((action, index) => (
                  <div key={index} className="pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {actionPlan.quarter.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Clock className="h-4 w-4" />
                Medium-term Actions (Next Quarter)
              </h3>
              <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                {actionPlan.quarter.map((action, index) => (
                  <div key={index} className="pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium">{action.title}</h4>
                      <Badge className={priorityColors[action.priority]}>
                        {action.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
