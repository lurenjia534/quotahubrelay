import { MaterialAvatar } from "@/app/components/material/primitives";

type UserSummaryProps = {
  email: string;
  image: string | null | undefined;
  name: string;
};

export function UserSummary({ email, image, name }: UserSummaryProps) {
  return (
    <div className="md-expressive-surface flex items-center gap-4 bg-surface-container px-4 py-3">
      <MaterialAvatar image={image} name={name} size="lg" />
      <div className="min-w-0">
        <p className="truncate md-title-small md-emphasized text-on-surface">
          {name}
        </p>
        <p className="truncate md-body-small text-on-surface-variant">{email}</p>
      </div>
    </div>
  );
}
