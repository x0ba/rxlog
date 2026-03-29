# Setup

## Development

Install dependencies:

```bash
bun install
```

Run app + Convex locally:

```bash
bun run dev
```

Run only the web app:

```bash
bun run dev:web
```

## Build / Run

```bash
bun run build
bun run start
```

## Quality checks

```bash
bun typecheck
bun lint
bun format
```

## Environment variables

### App envs (`.env.local`)

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_SENTRY_DSN`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `VITE_PUBLIC_POSTHOG_HOST`

### Convex deployment envs

Set these on each Convex deployment with `bunx convex env set`:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_WEBHOOK_SECRET`

### Clerk webhook setup

Point Clerk directly at the Convex `.site` endpoint, not the app domain.

- Dev endpoint: `https://<dev-deployment>.convex.site/webhooks/clerk`
- Prod endpoint: `https://<prod-deployment>.convex.site/webhooks/clerk`

Enable these Clerk events:

- `user.created`
- `user.updated`
- `user.deleted`

If you change the webhook endpoint or secret, replay failed deliveries from the
Clerk dashboard after updating the configuration.
