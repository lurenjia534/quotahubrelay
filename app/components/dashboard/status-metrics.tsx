type StatusMetric = {
  label: string;
  value: number | string;
};

type StatusMetricsProps = {
  metrics: StatusMetric[];
};

export function StatusMetrics({ metrics }: StatusMetricsProps) {
  return (
    <dl className="grid overflow-hidden rounded-lg border sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-4 py-4 ${
            index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""
          }`}
        >
          <dt className="text-sm text-muted-foreground">{metric.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
