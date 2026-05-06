# QuotaHub Relay

QuotaHub Relay is the web and server component for QuotaHub. It centralizes provider credentials, fetches quota data from upstream AI services, normalizes that data into the same quota model used by the Android app, and exposes it through authenticated relay APIs.

The Android app's `Remote client mode` is expected to connect to this server with a settings-generated Bearer token. The web dashboard is used for owner sign-in, provider subscription management, quota refreshes, and relay settings.

## Current Capabilities

- GitHub SSO for the web dashboard
- Email allowlist for dashboard access
- Server-managed provider subscriptions
- Encrypted provider credential storage
- Normalized quota snapshots
- Dashboard-managed Android client Bearer tokens
- SQLite for local development
- Postgres support through `DATABASE_URL`

## Supported Providers

| Provider ID | Display name | Required credentials | Optional credentials |
| --- | --- | --- | --- |
| `codex` | OpenAI Codex | `accessToken` | `accountId` |
| `kimi` | Kimi Coding Plan | `apiKey` | |
| `minimax` | MiniMax Coding Plan | `apiKey` | |
| `zai` | Z.ai | `authToken` | `baseUrl` |
| `zhipu` | Zhipu BigModel | `authToken` | `baseUrl` |

Provider credentials are validated before a subscription is saved. Saved credentials are encrypted at rest with a key derived from `BETTER_AUTH_SECRET`.

## Tech Stack

- Next.js `16.2.4`
- React `19.2.4`
- Better Auth `1.6.9`
- Tailwind CSS `4`
- SQLite via `better-sqlite3`
- Postgres via `pg`
- ESLint `9`

## Requirements

- Node.js 20 or newer
- npm
- A GitHub account
- A GitHub OAuth App for each callback URL

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Create a GitHub OAuth App for local development:

```txt
Application name: QuotaHub Relay Local
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

Fill `.env.local`:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_ALLOWED_EMAILS=you@example.com
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
SQLITE_DATABASE_PATH=auth.sqlite
```

Generate a local auth secret:

```bash
openssl rand -hex 32
```

Run Better Auth migrations and start the app:

```bash
npm run auth:migrate
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | Client ID from the GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | Yes | Client Secret from the GitHub OAuth App. |
| `AUTH_ALLOWED_EMAILS` | Yes | Comma-separated dashboard allowlist. Example: `you@example.com,admin@example.com`. |
| `BETTER_AUTH_SECRET` | Yes | Secret used by Better Auth and relay credential encryption. Use a unique value per environment. |
| `BETTER_AUTH_URL` | Yes | Public base URL of this deployment. Local default: `http://localhost:3000`. |
| `SQLITE_DATABASE_PATH` | Local | SQLite database path when `DATABASE_URL` is unset. |
| `DATABASE_URL` | Production | Postgres connection string. When set, relay and auth data use Postgres. |

Do not use `NEXT_PUBLIC_` for secrets.

## Dashboard Flow

1. Sign in with an allowed GitHub account.
2. Open `/dashboard`.
3. Add a provider subscription.
4. Relay validates the credentials against the upstream provider.
5. Relay saves encrypted credentials and the first normalized quota snapshot.
6. Open `/dashboard/settings` and create an Android client token if a remote client should read relay data.
7. Store the generated `qhr_...` token in the Android client. It is only shown once.

## Relay API

Relay endpoints are mounted under `/api/relay`.

Browser requests use the GitHub dashboard session. Android or other linked clients use:

```txt
Authorization: Bearer qhr_...
```

Client token management requires the GitHub dashboard session. Subscription and provider read/refresh endpoints accept either a dashboard session or a valid Bearer token.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/relay/providers` | Session or Bearer | List provider descriptors and credential fields. |
| `GET` | `/api/relay/subscriptions` | Session or Bearer | List server-managed subscriptions and latest snapshots. |
| `POST` | `/api/relay/subscriptions` | Session or Bearer | Validate credentials, create a subscription, and cache the first snapshot. |
| `GET` | `/api/relay/subscriptions/:id` | Session or Bearer | Read one subscription and latest snapshot. |
| `DELETE` | `/api/relay/subscriptions/:id` | Session or Bearer | Delete a subscription and cached snapshot. |
| `POST` | `/api/relay/subscriptions/:id/refresh` | Session or Bearer | Refresh quota data with stored encrypted credentials. |
| `GET` | `/api/relay/client-tokens` | Session only | List settings-generated client tokens. |
| `POST` | `/api/relay/client-tokens` | Session only | Create a client token. |
| `DELETE` | `/api/relay/client-tokens/:id` | Session only | Revoke a client token. |

Create subscription example:

```json
{
  "providerId": "kimi",
  "customTitle": "Kimi work account",
  "credentials": {
    "values": {
      "apiKey": "..."
    }
  }
}
```

## Quota Snapshot Model

Relay normalizes upstream provider responses into the Android app's quota model:

- `QuotaSnapshot`
- `QuotaResource`
- `QuotaWindow`

Resource types:

- `Model`
- `Plan`
- `Feature`

Window scopes:

- `Interval`
- `Daily`
- `Weekly`
- `Monthly`
- `Rolling`

Units:

- `Request`
- `Token`
- `Credit`
- `Minute`
- `Percent`

## Database

Better Auth tables are managed by:

```bash
npm run auth:migrate
```

Relay tables are created automatically at runtime:

- `quota_subscription`
- `quota_snapshot`
- `quota_client_token`

Local development uses SQLite unless `DATABASE_URL` is set:

```env
SQLITE_DATABASE_PATH=auth.sqlite
```

Production should use Postgres:

```env
DATABASE_URL=postgres://user:password@host:5432/database
```

## Deployment

For each production deployment:

1. Create a production GitHub OAuth App.
2. Set its callback URL:

   ```txt
   https://your-domain.com/api/auth/callback/github
   ```

3. Set production environment variables:

   ```env
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   AUTH_ALLOWED_EMAILS=
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=https://your-domain.com
   DATABASE_URL=
   ```

4. Run `npm run auth:migrate` against the production database.
5. Deploy the app.
6. Sign in to `/dashboard`.
7. Add provider subscriptions.
8. Open `/dashboard/settings` and create Android client tokens as needed.

GitHub OAuth Apps support a single callback URL. Use separate OAuth Apps for local and production.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server. |
| `npm run build` | Build the production app. |
| `npm run start` | Start the production server after `npm run build`. |
| `npm run lint` | Run ESLint. |
| `npm run auth:migrate` | Run Better Auth database migrations. |

## Project Structure

```txt
app/
  api/auth/[...all]/route.ts       Better Auth route handler
  api/relay/                       Relay API
  actions/auth.ts                  Sign-out server action
  components/auth/                 Auth UI
  components/quota/                Dashboard quota management UI
  dashboard/page.tsx               Protected dashboard
  lib/auth.ts                      Better Auth server config and allowlist checks
  lib/auth-client.ts               Better Auth browser client
  lib/quota/                       Provider adapters, encrypted store, API auth helpers, quota types
  page.tsx                         Sign-in page
```

## Security Notes

- Never commit `.env.local` or real secrets.
- Rotate `GITHUB_CLIENT_SECRET` if exposed.
- Rotate `BETTER_AUTH_SECRET` only with a plan, because existing encrypted provider credentials depend on it.
- Treat `qhr_...` client tokens like passwords.
- Revoke lost Android client tokens from `/dashboard/settings`.
- Keep `AUTH_ALLOWED_EMAILS` narrow.
- Do not reuse another deployment's GitHub OAuth App credentials.

## Troubleshooting

### `GitHub SSO is not configured`

Check:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_ALLOWED_EMAILS=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

`AUTH_ALLOWED_EMAILS` must contain at least one email.

### `Access denied`

The signed-in GitHub email is not listed in `AUTH_ALLOWED_EMAILS`.

### Android client receives `401`

Check the request header:

```txt
Authorization: Bearer qhr_...
```

If the token was revoked or lost, create a new one from `/dashboard/settings`.

### Provider subscription creation fails

The relay validates upstream credentials before saving. Confirm the selected provider fields match [Supported Providers](#supported-providers), then verify that the upstream account can access its usage endpoint.

### GitHub OAuth redirects fail

The OAuth callback URL must exactly match the deployment URL:

```txt
http://localhost:3000/api/auth/callback/github
```

or:

```txt
https://your-domain.com/api/auth/callback/github
```

If Next.js starts on another port, update `BETTER_AUTH_URL` and the GitHub OAuth App callback URL, or free port `3000`.

### `next/font` fails during build

This app uses `next/font/google` for Geist fonts. Production builds need network access to fetch font files unless the app is changed to local fonts.

## Development Notes

This project uses a newer Next.js version with breaking changes. Before changing Next.js APIs, routing conventions, or file conventions, read the relevant guide in:

```txt
node_modules/next/dist/docs/
```

This mirrors the repository guidance in `AGENTS.md`.
