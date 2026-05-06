import Link from "next/link";
import { SignOutButton } from "@/app/components/auth/sign-out-button";

type DashboardShellProps = {
  activeItem: "overview" | "settings";
  children: React.ReactNode;
  description: string;
  title: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  };
};

export function DashboardShell({
  activeItem,
  children,
  description,
  title,
  user,
}: DashboardShellProps) {
  const displayName = user.name || user.email || "User";

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
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar image={user.image} name={displayName} />
              <span className="max-w-32 truncate text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:max-w-44">
                {displayName}
              </span>
            </div>
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

function UserAvatar({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 object-cover dark:bg-zinc-900"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
      {name.slice(0, 1).toUpperCase()}
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
