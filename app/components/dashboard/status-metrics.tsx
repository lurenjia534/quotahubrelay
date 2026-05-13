import * as motion from "motion/react-client";
import {
  expressiveContainer,
  expressiveItem,
  materialHover,
  materialTap,
} from "@/app/components/material/motion";
import { cn } from "@/lib/utils";

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
      aria-label="Status metrics"
      className="grid gap-2 sm:grid-cols-3"
      variants={expressiveContainer}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          className={cn(
            "md-expressive-surface relative min-h-36 overflow-hidden px-5 py-4",
            index === 0 && "bg-primary-container text-on-primary-container",
            index === 1 && "bg-secondary-container text-on-secondary-container",
            index === 2 && "bg-tertiary-container text-on-tertiary-container",
          )}
          variants={expressiveItem}
          whileHover={materialHover}
          whileTap={materialTap}
        >
          <motion.span
            animate={{ scaleX: 1 }}
            className="mb-6 block h-2 w-20 origin-left rounded-full bg-current"
            initial={{ scaleX: 0 }}
            transition={{ delay: 0.12 + index * 0.06 }}
          />
          <p className="md-title-large md-emphasized opacity-80">
            {metric.label}
          </p>
          <p className="mt-5 md-display-small md-numeral">
            {metric.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
