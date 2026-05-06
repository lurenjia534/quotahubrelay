import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white dark:bg-black">
      <main className="w-full max-w-sm px-4">
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="text-xl font-medium text-black dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Welcome to QuotaHub Relay
          </p>
        </div>

        <div className="border-t border-zinc-200 py-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">GitHub name</p>
          <p className="mt-1 truncate text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {user.name}
          </p>
        </div>
      </main>
    </div>
  );
}
