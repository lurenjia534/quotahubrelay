import * as motion from "motion/react-client";
import {
  expressiveContainer,
  expressiveItem,
  materialHover,
} from "@/app/components/material/motion";

type StatusMetric = {
  label: string;
  value: number | string;
};

type StatusMetricsProps = {
  metrics: StatusMetric[];
};

export function StatusMetrics({ metrics }: StatusMetricsProps) {
  return (
    <motion.div
      className="grid overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low sm:grid-cols-3"
      variants={expressiveContainer}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          className="relative px-5 py-4 sm:border-r sm:border-outline-variant sm:last:border-r-0"
          variants={expressiveItem}
          whileHover={materialHover}
        >
          <motion.span
            animate={{ scaleX: 1 }}
            className="mb-4 block h-1.5 w-14 origin-left rounded-full"
            initial={{ scaleX: 0 }}
            style={{
              background:
                index === 0
                  ? "var(--md-sys-color-primary)"
                  : index === 1
                    ? "var(--md-sys-color-secondary)"
                    : "var(--md-sys-color-tertiary)",
            }}
            transition={{ delay: 0.12 + index * 0.06 }}
          />
          <p className="md-label-large text-on-surface-variant">
            {metric.label}
          </p>
          <p className="mt-2 md-headline-large md-emphasized text-on-surface">
            {metric.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
