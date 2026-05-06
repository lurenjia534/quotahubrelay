import Link from "next/link";
import { SignOutButton } from "@/app/components/auth/sign-out-button";

type DashboardShellProps = {
  activeItem: "overview" | "settings";
  children: React.ReactNode;
  description: string;
  email?: string | null;
  title: string;
};

export function DashboardShell({
  activeItem,
  children,
  description,
  email,
  title,
}: DashboardShellProps) {
  return (
    <div className="min-h-full flex-1 bg-white dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/dashboard"
              className="shrink-0 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              QuotaHub Relay
            </Link>

            <nav aria-label="Dashboard" className="flex items-center gap-6">
              <NavItem
                active={activeItem === "overview"}
                href="/dashboard"
                label="Overview"
              />
              <NavItem
                active={activeItem === "settings"}
                href="/dashboard/settings"
                label="Settings"
              />
            </nav>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden max-w-56 truncate text-sm text-zinc-500 dark:text-zinc-400 sm:block">
              {email}
            </span>
            <div className="w-28">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}

function NavItem({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "text-sm font-medium text-zinc-950 dark:text-zinc-50"
          : "text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      }
    >
      {label}
    </Link>
  );
}
