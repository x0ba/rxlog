import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ClipboardList,
  FileDown,
  History,
  Settings,
} from 'lucide-react'
import * as React from 'react'
import {
  ensurePatientAccessOnClient,
  patientSummaryQuery,
} from '~/lib/convex-queries'
import type { Id } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authed/patients/$patientId')({
  loader: async ({ context, params }) => {
    await ensurePatientAccessOnClient(
      context.queryClient.ensureQueryData.bind(context.queryClient),
      params.patientId as Id<'patients'>,
    )
  },
  component: PatientLayout,
})

const NAV_ITEMS = [
  {
    to: '/patients/$patientId' as const,
    label: 'Log',
    icon: ClipboardList,
    exact: true,
  },
  {
    to: '/patients/$patientId/history' as const,
    label: 'History',
    icon: History,
  },
  {
    to: '/patients/$patientId/export' as const,
    label: 'Export',
    icon: FileDown,
  },
  {
    to: '/patients/$patientId/settings' as const,
    label: 'Settings',
    icon: Settings,
  },
]

function PatientHeaderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4 animate-fade-in">
        <div className="h-9 w-9 animate-pulse border-2 border-border bg-muted/40" />
        <div className="min-w-0 space-y-2">
          <div className="h-3 w-18 animate-pulse bg-muted" />
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <div className="h-4 w-32 animate-pulse bg-muted" />
        </div>
      </div>
      <div className="h-12 animate-pulse border-b-3 border-border bg-muted/30" />
    </div>
  )
}

function PatientLayout() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId' })
  const typedPatientId = patientId as Id<'patients'>
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isRouterLoading = useRouterState({ select: (state) => state.isLoading })
  const matchRoute = useMatchRoute()
  const { data: patient } = useQuery(patientSummaryQuery(typedPatientId))
  const navRef = React.useRef<HTMLElement | null>(null)
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0 })
  const [bumpNonce, setBumpNonce] = React.useState(0)

  const updateIndicator = React.useCallback(() => {
    const navEl = navRef.current
    if (!navEl) return

    const active = navEl.querySelector<HTMLElement>('.tab-link-active')
    if (!active) return

    const left = active.offsetLeft - navEl.scrollLeft
    const width = active.offsetWidth
    setIndicator({ left, width })
  }, [])

  React.useLayoutEffect(() => {
    updateIndicator()
    setBumpNonce((value) => value + 1)
  }, [pathname, updateIndicator])

  React.useLayoutEffect(() => {
    const navEl = navRef.current
    if (!navEl) return

    const resizeObserver = new ResizeObserver(() => updateIndicator())
    resizeObserver.observe(navEl)

    const onScroll = () => updateIndicator()
    navEl.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      navEl.removeEventListener('scroll', onScroll)
    }
  }, [updateIndicator])

  if (patient === undefined) {
    return (
      <div className="space-y-6">
        <PatientHeaderSkeleton />
        <Outlet />
      </div>
    )
  }

  if (patient === null) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-black">Patient not found</h2>
        <p className="text-muted-foreground mt-2">
          This patient does not exist or you don&apos;t have access.
        </p>
        <Link to="/" className="text-sm underline mt-4 inline-block">
          Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 sm:gap-4 animate-fade-in">
        <Link
          to="/"
          preload="intent"
          className="inline-flex items-center justify-center h-9 w-9 border-2 border-foreground/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all brutalist-shadow-sm shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-0.5">
            Patient
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
            {patient.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
            DOB{' '}
            {new Date(patient.birthDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <nav
        ref={navRef}
        className="relative flex gap-0 border-b-3 border-foreground/80 animate-fade-in overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide"
        style={{ animationDelay: '80ms' }}
      >
        <div
          aria-hidden="true"
          className="rx-tab-indicator"
          style={{
            width: `${indicator.width}px`,
            transform: `translateX(${indicator.left}px) translateY(3px)`,
            animationName: bumpNonce ? 'pulse-subtle' : undefined,
            animationDuration: bumpNonce ? '650ms' : undefined,
            animationTimingFunction: bumpNonce ? 'ease' : undefined,
            animationIterationCount: bumpNonce ? '1' : undefined,
          }}
        />
        {NAV_ITEMS.map((item) => {
          const isPending =
            isRouterLoading &&
            matchRoute({
              to: item.to,
              params: { patientId },
              pending: true,
              fuzzy: !item.exact,
            }) !== false

          return (
            <Link
              key={item.label}
              to={item.to}
              params={{ patientId }}
              preload="intent"
              activeOptions={{ exact: item.exact }}
              className="tab-link flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all -mb-[3px] whitespace-nowrap shrink-0"
              activeProps={{
                className:
                  'tab-link tab-link-active flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-sm font-black text-primary bg-primary/8 -mb-[3px] whitespace-nowrap shrink-0',
              }}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden text-xs">{item.label}</span>
              {isPending ? (
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <Outlet />
      </div>
    </div>
  )
}
