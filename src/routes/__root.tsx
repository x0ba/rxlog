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
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/tanstack-react-start'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { Heart, Moon, Sun } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PostHogProvider } from 'posthog-js/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { QueryClient } from '@tanstack/react-query'
import type { Id } from '../../convex/_generated/dataModel'
import appCss from '~/styles/app.css?url'
import { ThemeProvider, useTheme } from '~/components/theme-provider'
import { patientSummaryQuery } from '~/lib/convex-queries'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

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
    <ClerkProvider
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN}
        options={options}
      >
        <ConvexProviderWithClerk
          client={context.convexClient}
          useAuth={useAuth}
        >
          <ThemeProvider>
            <RootDocument>
              <Outlet />
            </RootDocument>
          </ThemeProvider>
        </ConvexProviderWithClerk>
      </PostHogProvider>
    </ClerkProvider>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="border-border bg-card hover:bg-muted text-foreground inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all"
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

function PatientCrumb({ patientId }: { patientId: string }) {
  const { data: patient } = useQuery(
    patientSummaryQuery(patientId as Id<'patients'>),
  )
  if (!patient) return <span className="animate-pulse">···</span>
  return <>{patient.name}</>
}

function HeaderBreadcrumb() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const segments = pathname.split('/').filter(Boolean)

  type Crumb = { label: string | React.ReactNode; href?: string }
  const crumbs: Array<Crumb> = []

  if (
    segments[0] === 'dashboard' &&
    segments[1] === 'patients' &&
    segments[2]
  ) {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' })
    const patientHref = `/dashboard/patients/${segments[2]}`
    if (segments[3]) {
      crumbs.push({
        label: <PatientCrumb patientId={segments[2]} />,
        href: patientHref,
      })
      crumbs.push({
        label: segments[3].charAt(0).toUpperCase() + segments[3].slice(1),
      })
    } else {
      crumbs.push({
        label: <PatientCrumb patientId={segments[2]} />,
      })
    }
  } else if (segments[0] === 'dashboard' && segments[1] === 'user') {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' })
    crumbs.push({ label: 'Settings' })
  } else if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Dashboard' })
  }

  const lastCrumbIndex = crumbs.length - 1

  return (
    <nav className="flex min-w-0 items-center gap-2 text-sm">
      <Link
        to="/dashboard"
        className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
      >
        <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-lg">
          <Heart size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <span className="text-foreground font-extrabold tracking-tight">
          rxlog
        </span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span
          key={i}
          className={i === lastCrumbIndex ? 'contents' : 'hidden md:contents'}
        >
          <span className="text-muted-foreground/40 shrink-0">/</span>
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="text-muted-foreground hover:text-foreground min-w-0 truncate transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-muted-foreground min-w-0 truncate">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const isHome = useMatch({ from: '/', shouldThrow: false })
  const isLoading = useRouterState({ select: (state) => state.isLoading })
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isSignIn = pathname === '/sign-in' || pathname.startsWith('/sign-in/')
  const isCompare = pathname.startsWith('/compare')
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
      <body className="flex min-h-screen flex-col">
        <div
          className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-150 ${
            showPendingBar ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-primary mx-auto h-0.5 max-w-5xl origin-left animate-[loading-bar_1.1s_ease-in-out_infinite] rounded-full" />
        </div>
        {!isHome && !isSignIn && !isCompare && (
          <header className="border-border bg-card/80 sticky top-0 z-40 border-b backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
              <HeaderBreadcrumb />
              <div className="flex items-center gap-2">
                <SignedIn>
                  <ThemeToggle />
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <Link
                    to="/sign-in/$"
                    params={{ _splat: '' }}
                    preload="intent"
                    className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                  >
                    Sign in
                  </Link>
                </SignedOut>
              </div>
            </div>
          </header>
        )}
        {isHome || isSignIn || isCompare ? (
          children
        ) : (
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
            {children}
          </main>
        )}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
