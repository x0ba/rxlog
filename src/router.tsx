import { createRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { QueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { routeTree } from './routeTree.gen'
import { AuthBootstrapError } from '~/components/auth-bootstrap-error'

function DefaultRouterError({ error }: { error: Error }) {
  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
      <AuthBootstrapError
        message={
          import.meta.env.DEV
            ? error.message
            : 'Something went wrong while loading this page.'
        }
        detail={error.message}
      />
    </main>
  )
}

export function getRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!
  if (!CONVEX_URL) {
    throw new Error('missing VITE_CONVEX_URL envar')
  }
  const convex = new ConvexReactClient(CONVEX_URL, {
    unsavedChangesWarning: false,
  })
  const convexQueryClient = new ConvexQueryClient(convex)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  // @snippet start example
  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      scrollRestoration: true,
      defaultPreloadStaleTime: 0, // Let React Query handle all caching
      defaultErrorComponent: (err) => <DefaultRouterError error={err.error} />,
      defaultNotFoundComponent: () => <p>not found</p>,
      context: { queryClient, convexClient: convex, convexQueryClient },
    }),
    queryClient,
  )
  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      // Adds request headers and IP for users, for more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
      sendDefaultPii: true,
    })
  }
  // @snippet end example

  return router
}
