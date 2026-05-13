type StatusMetric = {
  label: string;
  value: number | string;
};

type StatusMetricsProps = {
  metrics: StatusMetric[];
};

export function StatusMetrics({ metrics }: StatusMetricsProps) {
  return (
    <div className="expressive-enter-delayed grid overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className="relative px-5 py-4 sm:border-r sm:border-outline-variant sm:last:border-r-0"
        >
          <span
            className="mb-4 block h-1.5 w-14 rounded-full"
            style={{
              background:
                index === 0
                  ? "var(--md-sys-color-primary)"
                  : index === 1
                    ? "var(--md-sys-color-secondary)"
                    : "var(--md-sys-color-tertiary)",
            }}
          />
          <p className="md-label-large text-on-surface-variant">
            {metric.label}
          </p>
          <p className="mt-2 md-headline-large md-emphasized text-on-surface">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}
