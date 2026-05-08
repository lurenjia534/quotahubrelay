import Link from "next/link";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    <div className="min-h-full flex-1 bg-background">
      <header className="border-b">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/dashboard"
              className="shrink-0 text-base font-semibold tracking-tight text-foreground"
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
              <span className="max-w-32 truncate text-sm font-medium text-foreground sm:max-w-44">
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
        <div className="pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <Separator />

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
        className="h-8 w-8 shrink-0 rounded-full bg-muted object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
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
      className={cn(
        "text-sm font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}
