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
bun run typecheck
bun run lint
```

## Environment variables

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_SENTRY_DSN`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `VITE_PUBLIC_POSTHOG_HOST`
