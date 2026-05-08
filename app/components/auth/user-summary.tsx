import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type UserSummaryProps = {
  email: string;
  image: string | null | undefined;
  name: string;
};

export function UserSummary({ email, image, name }: UserSummaryProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        <AvatarImage src={image ?? undefined} alt="" />
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
