import Link from "next/link";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-full flex-1 bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              href="/dashboard"
              className="shrink-0 font-heading text-base font-semibold tracking-tight text-foreground"
            >
              QuotaHub Relay
            </Link>

            <nav aria-label="Dashboard" className="flex items-center gap-1">
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

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar size="sm">
                {user.image ? (
                  <AvatarImage src={user.image} alt={displayName} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-32 truncate text-sm font-medium text-foreground sm:max-w-44">
                {displayName}
              </span>
            </div>
            <SignOutButton className="w-auto" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
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
        "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
