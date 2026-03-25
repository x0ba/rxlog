import { createFileRoute, Link, Outlet, useParams } from '@tanstack/react-router'
import { MOCK_PATIENTS } from '~/lib/mock-data'
import { ArrowLeft, ClipboardList, History, FileDown, Settings } from 'lucide-react'

export const Route = createFileRoute('/_authed/patients/$patientId')({
  component: PatientLayout,
})

const NAV_ITEMS = [
  { to: '/patients/$patientId' as const, label: 'Log', icon: ClipboardList, exact: true },
  { to: '/patients/$patientId/history' as const, label: 'History', icon: History },
  { to: '/patients/$patientId/export' as const, label: 'Export', icon: FileDown },
  { to: '/patients/$patientId/settings' as const, label: 'Settings', icon: Settings },
]

function PatientLayout() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId' })
  const patient = MOCK_PATIENTS.find((p) => p._id === patientId)

  if (!patient) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-black">Patient not found</h2>
        <p className="text-muted-foreground mt-2">This patient does not exist or you don't have access.</p>
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
          className="inline-flex items-center justify-center h-9 w-9 border-2 border-foreground/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all brutalist-shadow-sm shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-0.5">Patient</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{patient.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
            DOB {new Date(patient.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <nav className="flex gap-0 border-b-2 border-foreground/80 animate-fade-in overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide" style={{ animationDelay: '80ms' }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            params={{ patientId }}
            activeOptions={{ exact: item.exact }}
            className="tab-link flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors -mb-[2px] whitespace-nowrap shrink-0"
            activeProps={{
              className:
                'tab-link tab-link-active flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-sm font-semibold text-primary -mb-[2px] whitespace-nowrap shrink-0',
            }}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <Outlet />
      </div>
    </div>
  )
}
