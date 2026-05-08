import { SignInWithGithub } from "@/app/components/auth/sign-in-with-github";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { UserSummary } from "@/app/components/auth/user-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthPanelProps = {
  errorMessage: string | null;
  isConfigured: boolean;
  user?: {
    email: string;
    image?: string | null;
    name: string;
  } | null;
};

export function AuthPanel({ errorMessage, isConfigured, user }: AuthPanelProps) {
  const hasDeniedUser = Boolean(user);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{hasDeniedUser ? "Access denied" : "Sign in"}</CardTitle>
        <CardDescription>
          {hasDeniedUser
            ? "This GitHub account is not allowed."
            : "Continue with an approved GitHub account."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {user ? (
          <div className="space-y-4">
            <UserSummary email={user.email} image={user.image} name={user.name} />
            <SignOutButton />
          </div>
        ) : (
          <SignInWithGithub disabled={!isConfigured} />
        )}
      </CardContent>

      <CardFooter>
        <p className="w-full text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} QuotaHub Relay
        </p>
      </CardFooter>
    </Card>
  );
}
