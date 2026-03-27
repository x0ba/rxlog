import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useMatch,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/tanstack-react-start'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { Moon, Pill, Sun } from 'lucide-react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'
import { ThemeProvider, useTheme } from '~/components/theme-provider'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'RxLog',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <ThemeProvider>
          <RootDocument>
            <Outlet />
          </RootDocument>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center h-8 w-8 rounded-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const isHome = useMatch({ from: '/', shouldThrow: false })
  const isLoading = useRouterState({ select: (state) => state.isLoading })
  const [showPendingBar, setShowPendingBar] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading) {
      setShowPendingBar(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setShowPendingBar(true)
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [isLoading])

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <div
          className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-150 ${
            showPendingBar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="mx-auto h-0.5 max-w-5xl origin-left animate-[loading-bar_1.1s_ease-in-out_infinite] bg-accent shadow-[0_0_18px_oklch(0.72_0.17_35_/_0.55)]" />
        </div>
        {!isHome && (
          <header className="header-bar border-b-2 border-foreground/90 bg-primary text-primary-foreground">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 group">
                <span className="inline-flex items-center justify-center h-8 w-8 bg-accent/90 group-hover:bg-accent transition-colors">
                  <Pill
                    className="h-4.5 w-4.5 text-accent-foreground group-hover:rotate-[-12deg] transition-transform duration-200"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-lg font-black tracking-tight">RxLog</span>
              </Link>
              <div className="flex items-center gap-3">
                <SignedIn>
                  <ThemeToggle />
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal" />
                </SignedOut>
              </div>
            </div>
          </header>
        )}
        {isHome ? (
          children
        ) : (
          <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1">
            {children}
          </main>
        )}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
