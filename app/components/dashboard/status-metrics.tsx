import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatusMetric = {
  label: string;
  value: number | string;
};

type StatusMetricsProps = {
  metrics: StatusMetric[];
};

export function StatusMetrics({ metrics }: StatusMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm">
          <CardHeader>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              {metric.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
