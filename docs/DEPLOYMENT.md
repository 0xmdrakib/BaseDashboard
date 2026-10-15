# Deployment

## Runtime requirements

BaseDashboard is a full-stack application. GitHub is its source repository and CI host; GitHub Pages cannot execute its API routes or D1 bindings.

The current production target is a private Sites workspace running a Cloudflare Worker with:

- A D1 binding named `DB` and the tracked SQL migrations
- The compiled Worker in `dist/server/` and client assets in `dist/client/`
- Trusted server authentication supplied by the hosting platform
- Server-side PostHog configuration and a secret personal API key

`app/chatgpt-auth.ts` trusts identity headers inserted by the platform. Do not expose an instance on a different host that accepts these headers from arbitrary clients. An independent deployment needs an authentication adapter that verifies sessions and provides a stable owner ID.

## Updating the existing Sites workspace

Build and verify the exact source, synchronize it with the existing Site's source repository, package the matching build, and deploy the saved version using Sites. Preserve `.openai/hosting.json` and the current owner-only audience. The public GitHub repository does not grant access to the hosted workspace or its data.

Sites applies the tracked production migrations. They are append-only deployment history; do not delete or rewrite applied migrations.

## Creating your own instance

Create a new Site in your own account and bind this code to its returned project identity. The checked-in project ID identifies the original workspace and is not permission to deploy to it. Configure a D1 binding, apply the tracked schema, and supply your own PostHog settings.

For direct Cloudflare hosting, first implement verified owner authentication, provide a real D1 database binding, and configure the emitted Worker and static assets through your deployment tooling. The placeholder database ID in local Vite configuration is only for development.

## Configuration

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `POSTHOG_PROJECT_ID` | Default dashboard project ID | Server configuration |
| `POSTHOG_PUBLIC_KEY` | Default public project token | Public write token |
| `POSTHOG_REGION` | `us` or `eu` | Server configuration |
| `POSTHOG_PERSONAL_API_KEY` | Project-scoped `query:read` access | Secret, server only |
| `NEXT_PUBLIC_POSTHOG_KEY` | Next.js mini-app ingestion token | Public |
| `NEXT_PUBLIC_POSTHOG_HOST` | Regional ingestion host | Public |
| `VITE_POSTHOG_KEY` | Vite mini-app ingestion token | Public |
| `VITE_POSTHOG_HOST` | Regional ingestion host | Public |

Workspace Settings can supply the project ID, public token, and region. The private read key always remains a runtime secret. Only empty examples belong in Git.

## GitHub Actions

The CI workflow installs the lockfile, checks types, runs unit tests, builds the dashboard and SDK, prepares a fresh local D1 database, and runs local API tests. It does not deploy production or require production credentials.
