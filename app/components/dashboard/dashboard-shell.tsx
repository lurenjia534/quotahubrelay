import type { ReactNode } from "react";
import Link from "next/link";
import * as motion from "motion/react-client";
import { Gauge, Settings } from "lucide-react";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { MaterialAvatar } from "@/app/components/material/primitives";
import {
  expressiveContainer,
  expressiveItem,
  materialSpring,
} from "@/app/components/material/motion";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  activeItem: "overview" | "settings";
  children: ReactNode;
  description: string;
  title: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  };
};

const navItems = [
  {
    href: "/dashboard",
    icon: Gauge,
    id: "overview",
    label: "Overview",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    id: "settings",
    label: "Settings",
  },
] as const;

export function DashboardShell({
  activeItem,
  children,
  description,
  title,
  user,
}: DashboardShellProps) {
  const displayName = user.name || user.email || "User";

  return (
    <div className="min-h-full bg-background text-on-surface lg:grid lg:grid-cols-[96px_minmax(0,1fr)]">
      <motion.aside
        animate={{ opacity: 1, x: 0 }}
        className="sticky top-0 hidden h-svh border-r border-outline-variant bg-surface-container-low lg:flex lg:flex-col lg:items-center lg:justify-between lg:py-4"
        initial={{ opacity: 0, x: -18 }}
        transition={materialSpring}
      >
        <Link
          href="/dashboard"
          aria-label="QuotaHub Relay"
          className="md-state-layer md-expressive-type grid size-16 place-items-center rounded-[var(--md-sys-shape-corner-extra-large)] bg-primary text-xl font-bold text-on-primary expressive-shape"
        >
          Q
        </Link>

        <nav aria-label="Dashboard" className="flex flex-col items-center gap-3">
          {navItems.map((item) => (
            <RailItem
              key={item.id}
              active={activeItem === item.id}
              href={item.href}
              icon={<item.icon className="size-6" aria-hidden="true" />}
              label={item.label}
            />
          ))}
        </nav>

        <MaterialAvatar image={user.image} name={displayName} size="sm" />
      </motion.aside>

      <div className="min-w-0">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-low/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: -12 }}
          transition={materialSpring}
        >
          <div className="flex min-h-20 items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-3 lg:hidden"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-primary font-bold text-on-primary">
                Q
              </span>
              <span className="min-w-0">
                <span className="block truncate md-title-medium md-emphasized">
                  QuotaHub Relay
                </span>
                <span className="hidden truncate md-label-medium text-on-surface-variant min-[420px]:block">
                  Server quota relay
                </span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="md-label-large text-primary">QuotaHub Relay</p>
              <h1 className="md-headline-small md-emphasized truncate text-on-surface">
                {title}
              </h1>
            </div>

            <nav
              aria-label="Dashboard"
              className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-surface-container-high p-1 lg:hidden"
            >
              {navItems.map((item) => (
                <TopNavItem
                  key={item.id}
                  active={activeItem === item.id}
                  href={item.href}
                  icon={<item.icon className="size-4" aria-hidden="true" />}
                  label={item.label}
                />
              ))}
            </nav>

            <SignOutButton
              iconOnly
              className="size-10 shrink-0 px-0 sm:hidden"
            />

            <div className="hidden min-w-0 items-center gap-3 sm:flex">
              <MaterialAvatar image={user.image} name={displayName} size="sm" />
              <div className="hidden min-w-0 xl:block">
                <p className="max-w-48 truncate md-label-large md-emphasized text-on-surface">
                  {displayName}
                </p>
                <p className="max-w-48 truncate md-label-medium text-on-surface-variant">
                  Authorized
                </p>
              </div>
              <SignOutButton className="hidden w-auto md:inline-flex" />
            </div>
          </div>
        </motion.header>

        <motion.main
          animate="show"
          className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8"
          initial="hidden"
          variants={expressiveContainer}
        >
          <motion.div className="grid gap-3 pb-5 lg:hidden" variants={expressiveItem}>
            <p className="md-label-large text-primary">QuotaHub Relay</p>
            <h1 className="md-headline-small md-emphasized text-on-surface">
              {title}
            </h1>
          </motion.div>

          <motion.div
            className="grid gap-2 border-b border-outline-variant pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
            variants={expressiveItem}
          >
            <p className="max-w-3xl md-body-medium text-on-surface-variant">
              {description}
            </p>
            <p className="hidden md-label-large text-on-surface-variant lg:block">
              Server-rendered on demand
            </p>
          </motion.div>

          {children}
        </motion.main>
      </div>
    </div>
  );
}

function RailItem({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-20 flex-col items-center gap-1 rounded-[var(--md-sys-shape-corner-extra-large)] px-2 py-3 text-center md-label-medium",
        "transition-colors duration-300 ease-[var(--md-sys-motion-easing-standard)]",
        active
          ? "text-on-secondary-container"
          : "text-on-surface-variant hover:text-on-surface",
      )}
    >
      <span
        className={cn(
          "md-state-layer relative grid h-8 w-14 place-items-center overflow-hidden rounded-full transition-colors",
          !active && "group-hover:bg-surface-container-highest",
        )}
      >
        {active ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-secondary-container"
            layoutId="dashboard-rail-active"
            transition={materialSpring}
          />
        ) : null}
        <span className="relative z-10">{icon}</span>
      </span>
      <span>{label}</span>
    </Link>
  );
}

function TopNavItem({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "md-state-layer relative inline-flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-full px-3 md-label-large md-emphasized",
        active
          ? "text-on-secondary-container"
          : "text-on-surface-variant",
      )}
    >
      {active ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-secondary-container"
          layoutId="dashboard-top-active"
          transition={materialSpring}
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </span>
    </Link>
  );
}
