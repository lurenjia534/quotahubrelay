import type { ReactNode } from "react";
import Link from "next/link";
import { Gauge, Settings } from "lucide-react";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { MaterialAvatar } from "@/app/components/material/primitives";
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
      <aside className="sticky top-0 hidden h-svh border-r border-outline-variant bg-surface-container-low lg:flex lg:flex-col lg:items-center lg:justify-between lg:py-4">
        <Link
          href="/dashboard"
          aria-label="QuotaHub Relay"
          className="md-state-layer grid size-16 place-items-center rounded-[var(--md-sys-shape-corner-extra-large)] bg-primary text-xl font-bold text-on-primary"
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
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-3 lg:hidden">
              <span className="grid size-11 place-items-center rounded-[var(--md-sys-shape-corner-large)] bg-primary font-bold text-on-primary">
                Q
              </span>
              <span className="min-w-0">
                <span className="block md-title-medium md-emphasized">
                  QuotaHub Relay
                </span>
                <span className="block md-label-medium text-on-surface-variant">
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
              className="ml-auto flex items-center gap-1 rounded-full bg-surface-container-high p-1 lg:hidden"
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
        </header>

        <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="expressive-enter grid gap-3 pb-5 lg:hidden">
            <p className="md-label-large text-primary">QuotaHub Relay</p>
            <h1 className="md-headline-small md-emphasized text-on-surface">
              {title}
            </h1>
          </div>

          <div className="grid gap-2 border-b border-outline-variant pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <p className="max-w-3xl md-body-medium text-on-surface-variant">
              {description}
            </p>
            <p className="hidden md-label-large text-on-surface-variant lg:block">
              Server-rendered on demand
            </p>
          </div>

          {children}
        </main>
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
          "md-state-layer grid h-8 w-14 place-items-center rounded-full transition-colors",
          active
            ? "bg-secondary-container"
            : "group-hover:bg-surface-container-highest",
        )}
      >
        {icon}
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
        "md-state-layer inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-3 md-label-large md-emphasized",
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
