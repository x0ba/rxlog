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
import { Moon, Sun } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { QueryClient } from '@tanstack/react-query'
import type { Id } from '../../convex/_generated/dataModel'
import appCss from '~/styles/app.css?url'
import { ThemeProvider, useTheme } from '~/components/theme-provider'
import { patientSummaryQuery } from '~/lib/convex-queries'

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
      className="inline-flex items-center justify-center h-8 w-8 border border-primary-foreground/20 bg-primary-foreground/5 hover:bg-primary-foreground/15 text-primary-foreground transition-all hover:border-primary-foreground/40"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

function PatientCrumb({ patientId }: { patientId: string }) {
  const { data: patient } = useQuery(
    patientSummaryQuery(patientId as Id<'patients'>),
  )
  if (!patient) return <span className="animate-pulse">···</span>
  return <>{patient.name.toLowerCase()}</>
}

function HeaderBreadcrumb() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const segments = pathname.split('/').filter(Boolean)

  type Crumb = { label: string | React.ReactNode; href?: string }
  const crumbs: Array<Crumb> = []

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'dashboard' })
  } else if (segments[0] === 'patients' && segments[1]) {
    crumbs.push({ label: 'dashboard', href: '/dashboard' })
    const patientHref = `/patients/${segments[1]}`
    if (segments[2]) {
      crumbs.push({
        label: <PatientCrumb patientId={segments[1]} />,
        href: patientHref,
      })
      crumbs.push({ label: segments[2] })
    } else {
      crumbs.push({
        label: <PatientCrumb patientId={segments[1]} />,
      })
    }
  } else if (segments[0] === 'user') {
    crumbs.push({ label: 'settings' })
  }

  const lastCrumbIndex = crumbs.length - 1

  return (
    <nav className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] min-w-0">
      <Link
        to="/dashboard"
        className="font-black text-primary-foreground shrink-0 hover:text-accent transition-colors"
      >
        rxlog.
      </Link>
      {crumbs.map((crumb, i) => (
        <span
          key={i}
          className={i === lastCrumbIndex ? 'contents' : 'hidden md:contents'}
        >
          <span className="text-primary-foreground/30 shrink-0">/</span>
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors truncate min-w-0"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-primary-foreground/70 truncate min-w-0">
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
        {!isHome && !isSignIn && (
          <header className="header-bar border-b-3 border-foreground/90 bg-primary text-primary-foreground">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
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
                    className="inline-flex items-center justify-center border border-primary-foreground/30 bg-primary-foreground/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition-all hover:border-primary-foreground/55 hover:bg-primary-foreground/12"
                  >
                    Sign in
                  </Link>
                </SignedOut>
              </div>
            </div>
          </header>
        )}
        {isHome || isSignIn ? (
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
