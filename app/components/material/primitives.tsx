import * as React from "react";
import { cn } from "@/lib/utils";

type MaterialButtonVariant =
  | "filled"
  | "tonal"
  | "outlined"
  | "text"
  | "elevated"
  | "danger";
type MaterialButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type MaterialTone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

const focusRingClassName =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25";

export function materialButtonClassName({
  className,
  iconOnly,
  size = "md",
  variant = "filled",
}: {
  className?: string;
  iconOnly?: boolean;
  size?: MaterialButtonSize;
  variant?: MaterialButtonVariant;
} = {}) {
  return cn(
    "md-state-layer md-expressive-type inline-flex min-w-0 items-center justify-center rounded-full md-label-large md-emphasized tracking-normal",
    "transition-[background-color,border-color,color,font-variation-settings,transform] duration-300 ease-[var(--md-sys-motion-easing-standard)]",
    focusRingClassName,
    "disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
    !iconOnly && "gap-2",
    size === "xs" && (iconOnly ? "size-8" : "h-8 px-3"),
    size === "sm" && (iconOnly ? "size-10" : "h-10 px-4"),
    size === "md" && (iconOnly ? "size-12" : "h-12 px-6"),
    size === "lg" && (iconOnly ? "size-14" : "h-14 px-8"),
    size === "xl" && (iconOnly ? "size-16" : "h-16 px-10"),
    variant === "filled" && "bg-primary text-on-primary",
    variant === "tonal" &&
      "bg-secondary-container text-on-secondary-container",
    variant === "outlined" &&
      "border border-outline bg-transparent text-primary",
    variant === "text" && "bg-transparent text-primary",
    variant === "elevated" &&
      "bg-surface-container-low text-primary hover:bg-surface-container",
    variant === "danger" && "bg-error text-on-error",
    className,
  );
}

export type MaterialButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  iconOnly?: boolean;
  size?: MaterialButtonSize;
  variant?: MaterialButtonVariant;
};

export function MaterialButton({
  className,
  iconOnly,
  size,
  type,
  variant,
  ...props
}: MaterialButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={materialButtonClassName({ className, iconOnly, size, variant })}
      {...props}
    />
  );
}

export type MaterialTextFieldProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    description?: string;
    label: string;
  };

export function MaterialTextField({
  className,
  description,
  id,
  label,
  required,
  ...props
}: MaterialTextFieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className={cn("group min-w-0", className)}>
      <div className="rounded-t-[var(--md-sys-shape-corner-medium)] bg-surface-container-highest px-4 pb-1.5 pt-2 transition-[background-color,border-radius] duration-300 ease-[var(--md-sys-motion-easing-standard)] group-focus-within:bg-surface-container-high group-focus-within:rounded-t-[var(--md-sys-shape-corner-large)]">
        <label
          htmlFor={inputId}
          className="block md-label-medium text-on-surface-variant transition-colors group-focus-within:text-primary"
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <input
          id={inputId}
          required={required}
          aria-describedby={descriptionId}
          className={cn(
            "h-8 w-full bg-transparent md-body-large text-on-surface caret-primary",
            "placeholder:text-on-surface-variant/70",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-55",
          )}
          {...props}
        />
      </div>
      <div className="h-px bg-on-surface-variant transition-[height,background-color] duration-300 ease-[var(--md-sys-motion-easing-standard)] group-focus-within:h-0.5 group-focus-within:bg-primary" />
      {description ? (
        <p
          id={descriptionId}
          className="mt-1 px-4 md-body-small text-on-surface-variant"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

type MaterialAlertVariant = "info" | "success" | "warning" | "error";

export function MaterialAlert({
  children,
  className,
  title,
  variant = "info",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: MaterialAlertVariant;
}) {
  return (
    <div
      className={cn(
        "md-expressive-surface rounded-[var(--md-sys-shape-corner-large-increased)] px-4 py-3 md-body-medium",
        variant === "info" && "bg-primary-container text-on-primary-container",
        variant === "success" &&
          "bg-success-container text-on-success-container",
        variant === "warning" &&
          "bg-tertiary-container text-on-tertiary-container",
        variant === "error" && "bg-error-container text-on-error-container",
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      {title ? <p className="mb-1 md-emphasized">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

type MaterialBadgeVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "error";

export function MaterialBadge({
  children,
  className,
  variant = "secondary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: MaterialBadgeVariant;
}) {
  return (
    <span
      className={cn(
        "md-expressive-type inline-flex h-8 shrink-0 items-center rounded-full px-3 md-label-medium",
        variant === "primary" && "bg-primary text-on-primary",
        variant === "secondary" &&
          "bg-secondary-container text-on-secondary-container",
        variant === "outline" &&
          "border border-outline-variant bg-transparent text-on-surface-variant",
        variant === "success" && "bg-success-container text-on-success-container",
        variant === "warning" && "bg-tertiary-container text-on-tertiary-container",
        variant === "error" && "bg-error-container text-on-error-container",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MaterialSwitch({
  checked,
  className,
  disabled,
  id,
  onCheckedChange,
}: {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "md-state-layer relative h-8 w-[52px] rounded-full border-2 p-0.5 transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--md-sys-motion-easing-standard)]",
        focusRingClassName,
        "disabled:opacity-45",
        checked
          ? "border-primary bg-primary text-on-primary"
          : "border-outline bg-surface-container-highest text-on-surface-variant",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full transition-[background-color,border-radius,transform] duration-300 ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
          checked
            ? "translate-x-5 rounded-[var(--md-sys-shape-corner-large)] bg-on-primary"
            : "translate-x-0 bg-outline",
        )}
      />
    </button>
  );
}

export function MaterialAvatar({
  image,
  name,
  size = "md",
}: {
  image?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimension =
    size === "sm"
      ? "size-10 md-title-small"
      : size === "lg"
        ? "size-14 md-title-large"
        : "size-12 md-title-medium";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tertiary-container font-semibold text-on-tertiary-container",
        dimension,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export function MaterialIconSurface({
  children,
  className,
  size = "md",
  tone = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: MaterialTone;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center transition-[background-color,border-radius,transform] duration-300 ease-[var(--md-sys-motion-easing-emphasized)]",
        size === "sm" && "size-10 rounded-[var(--md-sys-shape-corner-large)]",
        size === "md" &&
          "size-12 rounded-[var(--md-sys-shape-corner-large-increased)]",
        size === "lg" &&
          "size-16 rounded-[var(--md-sys-shape-corner-extra-large)]",
        tone === "primary" && "bg-primary-container text-on-primary-container",
        tone === "secondary" &&
          "bg-secondary-container text-on-secondary-container",
        tone === "tertiary" &&
          "bg-tertiary-container text-on-tertiary-container",
        tone === "neutral" && "bg-surface-container-high text-on-surface",
        tone === "error" && "bg-error-container text-on-error-container",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MaterialSectionHeader({
  action,
  className,
  description,
  icon,
  meta,
  title,
  tone = "primary",
}: {
  action?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  meta?: React.ReactNode;
  title: React.ReactNode;
  tone?: MaterialTone;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start",
        className,
      )}
    >
      <div className="flex min-w-0 gap-4">
        <MaterialIconSurface tone={tone}>{icon}</MaterialIconSurface>
        <div className="min-w-0">
          {meta ? (
            <div className="mb-1 md-label-large text-primary">{meta}</div>
          ) : null}
          <h2 className="md-headline-small md-emphasized text-on-surface">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl md-body-medium text-on-surface-variant">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="sm:pt-1">{action}</div> : null}
    </div>
  );
}

export function MaterialLinearProgressIndicator({
  className,
  label,
  value,
  variant = "primary",
}: {
  className?: string;
  label?: string;
  value: number;
  variant?: "primary" | "tertiary" | "error";
}) {
  const percent = Math.min(Math.max(value, 0), 100);
  const activeWidth =
    percent <= 0
      ? "0%"
      : percent >= 100
        ? "100%"
        : `max(0px, calc(${percent}% - 4px))`;
  const trackLeft =
    percent <= 0
      ? "0"
      : percent >= 100
        ? "100%"
        : `calc(${percent}% + 4px)`;
  const colorClassName =
    variant === "error"
      ? "bg-error"
      : variant === "tertiary"
        ? "bg-tertiary"
        : "bg-primary";

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className={cn("relative h-4 w-full", className)}
      role="progressbar"
    >
      <div
        className="absolute right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-container-highest transition-[left] duration-[420ms] ease-[var(--md-sys-motion-easing-emphasized-decelerate)]"
        style={{ left: trackLeft }}
      />
      {percent > 0 ? (
        <div
          className={cn(
            "absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full",
            "transition-[width] duration-[420ms] ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
            colorClassName,
          )}
          style={{ width: activeWidth }}
        />
      ) : null}
      {percent < 100 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
            colorClassName,
          )}
          style={{ left: "100%" }}
        />
      ) : null}
    </div>
  );
}
