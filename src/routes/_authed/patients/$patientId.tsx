import {
  Link,
  Outlet,
  createFileRoute,
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
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  ensurePatientAccessOnClient,
  patientSummaryQuery,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'

export const Route = createFileRoute('/_authed/patients/$patientId')({
  loader: async ({ context, params }) => {
    await waitForAuthedAppReady({
      convexClient: context.convexClient,
      queryClient: context.queryClient,
    })
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
      <div className="animate-fade-in flex items-center gap-3 sm:gap-4">
        <div className="bg-muted/40 h-10 w-10 animate-pulse rounded-xl" />
        <div className="min-w-0 space-y-2">
          <div className="bg-muted h-3 w-18 animate-pulse rounded-xl" />
          <div className="bg-muted h-8 w-48 animate-pulse rounded-xl" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="bg-muted/30 h-12 animate-pulse rounded-xl" />
    </div>
  )
}

function PatientLayout() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId' })
  const typedPatientId = patientId as Id<'patients'>
  const isRouterLoading = useRouterState({ select: (state) => state.isLoading })
  const matchRoute = useMatchRoute()
  const { data: patient } = useQuery(patientSummaryQuery(typedPatientId))

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
        <Link to="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-center gap-4">
        <Link
          to="/dashboard"
          preload="intent"
          className="border-border text-muted-foreground hover:bg-muted inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="section-label mb-1">Patient</p>
          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
            {patient.name}
          </h1>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs sm:text-sm">
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
        className="bg-muted/50 animate-fade-in scrollbar-hide relative flex justify-center gap-1 overflow-x-auto rounded-2xl p-1 sm:justify-start"
        style={{ animationDelay: '80ms' }}
      >
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
              className="text-muted-foreground hover:text-foreground hover:bg-background/60 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold whitespace-nowrap transition-colors sm:gap-2 sm:px-5"
              activeProps={{
                className:
                  'flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-2.5 text-sm font-black bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0',
              }}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="text-xs sm:hidden">{item.label}</span>
              {isPending ? (
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-current opacity-70" />
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
