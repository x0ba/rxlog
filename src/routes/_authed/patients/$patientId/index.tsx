import { createFileRoute, useParams } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Check, Clock, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authed/patients/$patientId/')({
  component: LogScreen,
})

type ScheduleStatus = 'taken' | 'late' | 'missed' | 'pending'

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; badgeClass: string; icon: typeof Check }
> = {
  taken: {
    label: 'Taken',
    badgeClass: 'status-taken',
    icon: Check,
  },
  late: {
    label: 'Late',
    badgeClass: 'status-late',
    icon: Clock,
  },
  missed: {
    label: 'Missed',
    badgeClass: 'status-missed',
    icon: X,
  },
  pending: {
    label: 'Pending',
    badgeClass: 'status-pending',
    icon: AlertTriangle,
  },
}

function formatTime(hour: number) {
  const normalizedHour = ((hour % 24) + 24) % 24
  const ampm = normalizedHour >= 12 ? 'PM' : 'AM'
  const hour12 = normalizedHour % 12 || 12
  return `${hour12}:00 ${ampm}`
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getAccentBarClass(status: ScheduleStatus) {
  if (status === 'taken') return 'bg-emerald-500'
  if (status === 'late') return 'bg-amber-500'
  if (status === 'missed') return 'bg-red-500'
  return 'bg-foreground/20'
}

function getStatusConfig(status: string) {
  if (status === 'taken') return STATUS_CONFIG.taken
  if (status === 'late') return STATUS_CONFIG.late
  if (status === 'missed') return STATUS_CONFIG.missed
  return STATUS_CONFIG.pending
}

function getStatusAccentBarClass(status: string) {
  if (status === 'taken') return getAccentBarClass('taken')
  if (status === 'late') return getAccentBarClass('late')
  if (status === 'missed') return getAccentBarClass('missed')
  return getAccentBarClass('pending')
}

function LogScreen() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId/' })
  const typedPatientId = patientId as Id<'patients'>
  const schedule = useQuery(api.logs.getTodaySchedule, {
    patientId: typedPatientId,
  })
  const logMedicationTaken = useMutation(api.logs.logMedicationTaken)
  const logMedicationMissed = useMutation(api.logs.logMedicationMissed)
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const scheduleItems = schedule ?? []
  const resolvedCount = scheduleItems.filter(
    (item) => item.status !== 'pending',
  ).length
  const totalCount = scheduleItems.length
  const progressPercent =
    totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0

  const handleMarkTaken = async (
    medicationId: Id<'medications'>,
    actionKey: string,
  ) => {
    setSubmittingKey(actionKey)

    try {
      await logMedicationTaken({
        patientId: typedPatientId,
        medicationId,
      })
    } finally {
      setSubmittingKey(null)
    }
  }

  const handleMarkMissed = async (
    medicationId: Id<'medications'>,
    scheduledFor: number,
  ) => {
    const actionKey = `${medicationId}:${scheduledFor}:missed`
    setSubmittingKey(actionKey)

    try {
      await logMedicationMissed({
        patientId: typedPatientId,
        medicationId,
        scheduledFor,
      })
    } finally {
      setSubmittingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Today's Medications
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-2xl sm:text-3xl font-black text-primary tabular-nums">
            {resolvedCount}
            <span className="text-muted-foreground">/{totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-semibold">
            resolved
          </p>
        </div>
      </div>

      <div className="h-1.5 bg-muted border border-foreground/10 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid gap-3">
        {scheduleItems.map((item, index) => {
          const config = getStatusConfig(item.status)
          const StatusIcon = config.icon
          const isPending = item.status === 'pending'
          const takeActionKey = `${item.medication._id}:${item.scheduledFor}:taken`
          const missActionKey = `${item.medication._id}:${item.scheduledFor}:missed`
          const isSubmitting =
            submittingKey === takeActionKey || submittingKey === missActionKey

          return (
            <Card
              key={`${item.medication._id}-${item.scheduledFor}`}
              className={`border-2 rounded-none transition-all animate-card-enter ${
                isPending
                  ? 'border-foreground/80 brutalist-shadow-sm'
                  : 'border-border'
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div
                    className={`w-1.5 shrink-0 ${getStatusAccentBarClass(item.status)}`}
                  />
                  <div className="flex-1 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3
                          className={`text-base sm:text-lg font-bold ${
                            isPending ? '' : 'text-muted-foreground'
                          }`}
                        >
                          {item.medication.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${config.badgeClass} border rounded-none text-xs font-semibold`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="font-mono font-semibold tabular-nums">
                          {item.medication.dosage}
                        </span>
                        <span className="text-border">·</span>
                        <span>Scheduled {formatTime(item.scheduledHour)}</span>
                        {item.log && (
                          <>
                            <span className="text-border hidden sm:inline">
                              ·
                            </span>
                            <span className="hidden sm:inline">
                              {item.status === 'missed'
                                ? 'Marked missed'
                                : `Taken ${formatTimestamp(item.log.takenAt)}`}
                            </span>
                          </>
                        )}
                      </div>
                      {item.log?.loggedByUserName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Logged by {item.log.loggedByUserName}
                        </p>
                      )}
                      {item.log?.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{item.log.notes}"
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex w-full sm:w-auto gap-2 shrink-0">
                        <Button
                          size="lg"
                          variant="outline"
                          className="rounded-none h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-bold gap-2 flex-1 sm:flex-none border-2 border-foreground/80"
                          disabled={isSubmitting}
                          onClick={() =>
                            void handleMarkMissed(
                              item.medication._id,
                              item.scheduledFor,
                            )
                          }
                        >
                          <X className="h-5 w-5" />
                          Mark missed
                        </Button>
                        <Button
                          size="lg"
                          className="rounded-none h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-bold gap-2 flex-1 sm:flex-none brutalist-shadow-accent"
                          disabled={isSubmitting}
                          onClick={() =>
                            void handleMarkTaken(
                              item.medication._id,
                              takeActionKey,
                            )
                          }
                        >
                          <Check className="h-5 w-5" />
                          Mark as Taken
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {schedule !== undefined && scheduleItems.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-none">
          <p className="text-muted-foreground text-lg">
            No medications scheduled
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Add medications in settings to start tracking
          </p>
        </div>
      )}
    </div>
  )
}
