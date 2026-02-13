import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendationsListProps {
  title: string;
  items: string[];
}

export function RecommendationsList({
  title,
  items,
}: RecommendationsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-ink-muted">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

