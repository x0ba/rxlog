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
        <div className="h-10 w-10 animate-pulse border-3 border-border bg-muted/40" />
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
        <Link to="/dashboard" className="text-sm underline mt-4 inline-block">
          Back to patients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 animate-fade-in">
        <Link
          to="/dashboard"
          preload="intent"
          className="inline-flex items-center justify-center h-10 w-10 border-3 border-foreground/80 text-muted-foreground hover:text-accent-foreground hover:bg-accent hover:border-accent transition-all brutalist-shadow-sm shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="section-label mb-1">Patient</p>
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
        className="relative flex justify-center sm:justify-start gap-1 border-3 border-foreground/80 bg-muted/30 p-1 animate-fade-in overflow-x-auto scrollbar-hide"
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
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all whitespace-nowrap shrink-0"
              activeProps={{
                className:
                  'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-black !text-accent-foreground !bg-accent hover:!text-accent-foreground hover:!bg-accent whitespace-nowrap shrink-0 brutalist-shadow-sm',
              }}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden text-xs">{item.label}</span>
              {isPending ? (
                <span className="h-2 w-2 bg-accent-foreground animate-pulse" />
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
