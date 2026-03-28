import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Eye, FileDown } from 'lucide-react'
import { useState } from 'react'
import type { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { cn } from '~/lib/utils'
import {
  ensurePatientAccessOnClient,
  patientExportPreviewQuery,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'

export const Route = createFileRoute('/_authed/patients/$patientId/export')({
  loader: async ({ context, params }) => {
    await waitForAuthedAppReady({
      queryClient: context.queryClient,
    })
    await ensurePatientAccessOnClient(
      context.queryClient.ensureQueryData.bind(context.queryClient),
      params.patientId as Id<'patients'>,
    )
  },
  component: ExportScreen,
})

type ExportPreview = typeof api.logs.getExportPreview._returnType
type ExportRow = ExportPreview['rows'][number]

const STATUS_LABELS: Record<ExportRow['status'], string> = {
  taken: 'On time',
  late: 'Late',
  missed: 'Missed',
}

function getDefaultDateRange() {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  return {
    startDate: weekAgo.toISOString().split('T')[0] ?? '',
    endDate: today.toISOString().split('T')[0] ?? '',
  }
}

function formatDate(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp)
}

function formatHour(hour: number) {
  const normalizedHour = ((hour % 24) + 24) % 24
  const amPm = normalizedHour >= 12 ? 'PM' : 'AM'
  const hour12 = normalizedHour % 12 || 12
  return `${hour12}:00 ${amPm}`
}

function formatTimestamp(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

function formatPeriodDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusBadgeClass(status: ExportRow['status']) {
  if (status === 'taken') return 'status-taken'
  if (status === 'late') return 'status-late'
  return 'status-missed'
}

function PreviewSkeleton() {
  return (
    <div className="border-3 border-foreground/80 bg-card brutalist-shadow animate-card-enter">
      <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
        <div className="space-y-2">
          <div className="h-6 w-44 animate-pulse bg-muted/50" />
          <div className="h-4 w-32 animate-pulse bg-muted/40" />
        </div>
      </div>
      <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-8 w-16 animate-pulse bg-muted/50" />
              <div className="h-3 w-20 animate-pulse bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
      <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-8 animate-pulse border-2 border-border bg-muted/30"
            />
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-8">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse border-2 border-border bg-muted/30"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  className,
  labelClassName,
}: {
  label: string
  value: number
  className: string
  labelClassName: string
}) {
  return (
    <div className={cn('stat-block p-4 sm:p-6', className)}>
      <p className="font-mono text-3xl font-black tabular-nums sm:text-4xl">
        {value}
      </p>
      <p
        className={cn(
          'mt-2 text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs',
          labelClassName,
        )}
      >
        {label}
      </p>
    </div>
  )
}

function ExportScreen() {
  const { patientId } = Route.useParams()
  const typedPatientId = patientId as Id<'patients'>
  const defaults = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [showPreview, setShowPreview] = useState(false)
  const isInvalidRange = startDate > endDate

  const previewQuery = patientExportPreviewQuery(
    typedPatientId,
    startDate,
    endDate,
  )
  const {
    data: preview,
    error,
    isPending,
  } = useQuery({
    ...previewQuery,
    enabled: showPreview && !isInvalidRange,
  })

  const timeZone = preview?.patient.timezone ?? 'UTC'

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-2">Reports</p>
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          Export Report
        </h2>
      </div>

      <div className="space-y-4 border-3 border-foreground/80 p-4 sm:space-y-6 sm:p-6 brutalist-shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em]">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-none border-3 border-foreground/80 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em]">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-none border-3 border-foreground/80 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="w-full rounded-none border-3 border-foreground/80 font-black gap-2 sm:w-auto"
            onClick={() => setShowPreview((current) => !current)}
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Button className="w-full rounded-none font-black gap-2 brutalist-shadow-accent sm:w-auto">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {isInvalidRange && (
          <div className="border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            Start date must be on or before end date.
          </div>
        )}
      </div>

      {showPreview ? (
        isInvalidRange ? (
          <div className="border-3 border-foreground/80 bg-card p-6 text-sm text-muted-foreground brutalist-shadow">
            Fix the date range to generate the preview.
          </div>
        ) : isPending ? (
          <PreviewSkeleton />
        ) : error ? (
          <div className="border-3 border-red-400 bg-red-50 p-6 text-sm text-red-800 brutalist-shadow dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error.message}
          </div>
        ) : (
          <div className="border-3 border-foreground/80 bg-card text-foreground brutalist-shadow animate-card-enter">
            <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black sm:text-xl">
                    Medication Report
                  </h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground sm:text-sm">
                    Generated{' '}
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-base font-black sm:text-lg">
                    {preview.patient.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground sm:text-sm">
                    DOB: {preview.patient.birthDate}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs font-mono text-muted-foreground sm:mt-4 sm:text-sm">
                Period: {formatPeriodDate(preview.period.startDate)} {' — '}{' '}
                {formatPeriodDate(preview.period.endDate)}
              </div>
            </div>

            <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">
                Summary
              </h4>
              <div className="grid grid-cols-2 gap-0 border-3 border-foreground/80 sm:grid-cols-4">
                <SummaryCard
                  label="Total doses"
                  value={preview.summary.total}
                  className="border-b-3 border-r-3 border-foreground/80 bg-muted/30 text-foreground sm:border-b-0"
                  labelClassName="text-muted-foreground"
                />
                <SummaryCard
                  label="On time"
                  value={preview.summary.taken}
                  className="border-b-3 border-foreground/80 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 sm:border-r-3 sm:border-b-0"
                  labelClassName="text-emerald-600/60 dark:text-emerald-500/60"
                />
                <SummaryCard
                  label="Late"
                  value={preview.summary.late}
                  className="border-r-3 border-foreground/80 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  labelClassName="text-amber-600/60 dark:text-amber-500/60"
                />
                <SummaryCard
                  label="Missed"
                  value={preview.summary.missed}
                  className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  labelClassName="text-red-600/60 dark:text-red-500/60"
                />
              </div>

              {preview.summary.missed > 0 && (
                <div className="mt-4 border-2 border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">
                    {preview.summary.missed} missed dose
                    {preview.summary.missed === 1 ? '' : 's'} during this period
                  </p>
                </div>
              )}
            </div>

            <div className="border-b-3 border-foreground/80 p-4 sm:p-8">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">
                Active Medications
              </h4>
              {preview.medications.length > 0 ? (
                <div className="grid gap-2">
                  {preview.medications.map((medication) => (
                    <div
                      key={medication._id}
                      className="flex items-center justify-between gap-2 py-1 text-sm"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-bold">{medication.name}</span>
                        <Badge
                          variant="outline"
                          className="rounded-none font-mono text-xs"
                        >
                          {medication.dosage}
                        </Badge>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground sm:text-sm">
                        {medication.scheduledTimes
                          .map((scheduledHour) => formatHour(scheduledHour))
                          .join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No active medications found.
                </div>
              )}
            </div>

            <div className="p-4 sm:p-8">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider">
                Dose Log
              </h4>
              {preview.rows.length > 0 ? (
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="border-b-3 border-foreground/80">
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Medication
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Scheduled
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Actual
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Logged By
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((row) => (
                        <TableRow key={row.key} className="font-mono text-sm">
                          <TableCell>
                            {formatDate(row.scheduledFor, timeZone)}
                          </TableCell>
                          <TableCell className="font-sans font-semibold">
                            <div className="flex items-center gap-2">
                              <span>{row.medicationName}</span>
                              {row.medicationDosage ? (
                                <span className="text-xs text-muted-foreground">
                                  {row.medicationDosage}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatHour(row.scheduledHour)}</TableCell>
                          <TableCell>
                            {row.isInferred || row.takenAt === null
                              ? '—'
                              : formatTimestamp(row.takenAt, timeZone)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-none border font-bold',
                                getStatusBadgeClass(row.status),
                              )}
                            >
                              {STATUS_LABELS[row.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-sans">
                            {row.isInferred
                              ? '—'
                              : (row.loggedByUserName ?? '—')}
                          </TableCell>
                          <TableCell className="font-sans italic text-muted-foreground">
                            {row.notes ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border-2 border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No doses in this range.
                </div>
              )}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}
