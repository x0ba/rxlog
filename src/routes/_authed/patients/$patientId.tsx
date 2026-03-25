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
  // MOCK: Replace with real query
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
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{patient.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            DOB {new Date(patient.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <nav className="flex gap-1 border-b-2 border-foreground/80">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            params={{ patientId }}
            activeOptions={{ exact: item.exact }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-[2px]"
            activeProps={{
              className:
                'flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary border-b-2 border-primary -mb-[2px]',
            }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
