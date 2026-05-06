# QuotaHub Relay

QuotaHub Relay is a private Next.js application protected by GitHub SSO. The current app provides a GitHub sign-in flow, an email allowlist, and a protected dashboard foundation for future QuotaHub Relay features.

## Features

- GitHub OAuth sign-in through Better Auth
- Server-side email allowlist for private access
- Protected `/dashboard` route
- Local SQLite database by default
- Postgres support for production through `DATABASE_URL`
- Next.js App Router, React 19, Tailwind CSS 4

## Tech Stack

- Next.js `16.2.4`
- React `19.2.4`
- Better Auth `1.6.9`
- SQLite via `better-sqlite3`
- Postgres via `pg`
- Tailwind CSS `4`
- ESLint `9`

## Requirements

- Node.js 20 or newer
- npm
- A GitHub account
- A GitHub OAuth App for each deployment URL

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Create a GitHub OAuth App, fill `.env.local`, run the auth migration, then start the dev server:

```bash
npm run auth:migrate
npm run dev
```

Open:

```txt
http://localhost:3000
```

## GitHub OAuth Setup

Each person or environment deploying this app should create its own GitHub OAuth App. Do not reuse someone else's `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET`.

Create an OAuth App here:

```txt
GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App
```

For local development with the default Next.js port:

```txt
Application name: QuotaHub Relay Local
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

For production:

```txt
Application name: QuotaHub Relay
Homepage URL: https://your-domain.com
Authorization callback URL: https://your-domain.com/api/auth/callback/github
```

GitHub OAuth Apps support a single callback URL. If you need both local and production login, create two OAuth Apps.

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_ALLOWED_EMAILS=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
SQLITE_DATABASE_PATH=auth.sqlite
# DATABASE_URL=postgres://user:password@host:5432/database
```

### Variable Reference

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | Client ID from your GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | Yes | Client Secret from your GitHub OAuth App. Never commit it. |
| `AUTH_ALLOWED_EMAILS` | Yes | Comma-separated allowlist of GitHub account emails. Example: `me@example.com,admin@example.com`. |
| `BETTER_AUTH_SECRET` | Yes | Secret used by Better Auth for signing/encryption. Generate one per environment. |
| `BETTER_AUTH_URL` | Yes | Public base URL of this app. Local default: `http://localhost:3000`. |
| `SQLITE_DATABASE_PATH` | Local | SQLite file path used when `DATABASE_URL` is unset. |
| `DATABASE_URL` | Production | Postgres connection string. When set, the app uses Postgres instead of SQLite. |

Generate a local auth secret:

```bash
openssl rand -hex 32
```

## Access Control

Access is controlled by `AUTH_ALLOWED_EMAILS`.

The app fails closed:

- If `AUTH_ALLOWED_EMAILS` is empty, GitHub SSO is treated as not configured.
- If a GitHub user's email is not in the allowlist, sign-in is denied.
- Existing sessions are checked again before entering `/dashboard`.

Example:

```env
AUTH_ALLOWED_EMAILS=you@example.com,admin@example.com
```

GitHub accounts with private email settings are still supported because the GitHub provider requests `user:email` and reads the primary GitHub email.

## Database

Local development defaults to SQLite:

```env
SQLITE_DATABASE_PATH=auth.sqlite
```

Run Better Auth migrations after configuring env vars:

```bash
npm run auth:migrate
```

For production, set `DATABASE_URL` to a Postgres connection string:

```env
DATABASE_URL=postgres://user:password@host:5432/database
```

Run the migration against the production database before using the deployed app.

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
  actions/auth.ts                  Server action for sign out
  components/auth/                 Auth UI components
  dashboard/page.tsx               Protected dashboard page
  lib/auth.ts                      Server-side Better Auth config
  lib/auth-client.ts               Client-side Better Auth client
  page.tsx                         Sign-in page
```

## Deployment

For Vercel or another production host:

1. Create a production GitHub OAuth App.
2. Set the production callback URL:

   ```txt
   https://your-domain.com/api/auth/callback/github
   ```

3. Configure production environment variables:

   ```env
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   AUTH_ALLOWED_EMAILS=
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=https://your-domain.com
   DATABASE_URL=
   ```

4. Run Better Auth migrations against the production database.
5. Deploy the app.

If your deployment URL changes, update both `BETTER_AUTH_URL` and the GitHub OAuth App callback URL.

## Security Notes

- Never commit `.env.local` or any real secret.
- Rotate `GITHUB_CLIENT_SECRET` if it was shared or exposed.
- Use a unique `BETTER_AUTH_SECRET` per environment.
- Keep `AUTH_ALLOWED_EMAILS` as narrow as possible.
- Do not reuse another deployment's GitHub OAuth App credentials.

## Troubleshooting

### `GitHub SSO is not configured`

Check that all required variables are set:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_ALLOWED_EMAILS=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

`AUTH_ALLOWED_EMAILS` must contain at least one email.

### `Access denied`

The signed-in GitHub account email is not listed in `AUTH_ALLOWED_EMAILS`. Add the primary GitHub email to the allowlist and restart the server.

### GitHub redirects back with an OAuth error

Verify the callback URL in the GitHub OAuth App exactly matches your app URL:

```txt
http://localhost:3000/api/auth/callback/github
```

or:

```txt
https://your-domain.com/api/auth/callback/github
```

### Local dev server uses another port

If Next.js starts on `3001` because `3000` is already in use, GitHub OAuth will fail unless you also update:

- `BETTER_AUTH_URL`
- GitHub OAuth App `Homepage URL`
- GitHub OAuth App `Authorization callback URL`

The simplest fix is usually to stop the process using port `3000` and keep the default local OAuth settings.

### `next/font` fails during build

This app uses Google-hosted Geist fonts through `next/font/google`. A production build needs network access to fetch those font files unless the app is changed to use local fonts.

## Development Notes

This project uses a newer Next.js version with breaking changes. Before changing Next.js APIs, routing conventions, or file conventions, read the relevant guide in:

```txt
node_modules/next/dist/docs/
```

This mirrors the repository guidance in `AGENTS.md`.
