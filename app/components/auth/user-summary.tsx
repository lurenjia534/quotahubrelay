type UserSummaryProps = {
  email: string;
  image: string | null | undefined;
  name: string;
};

export function UserSummary({ email, image, name }: UserSummaryProps) {
  return (
    <div className="flex items-center gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-10 w-10 rounded-full" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {name}
        </p>
        <p className="truncate text-xs text-zinc-500">{email}</p>
      </div>
    </div>
  );
}
