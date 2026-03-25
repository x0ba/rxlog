import { createFileRoute, useParams } from '@tanstack/react-router'
import {
  getTodaySchedule,
  formatTime,
  formatTimestamp,
  getUserById,
  type DoseStatus,
} from '~/lib/mock-data'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Check, Clock, AlertTriangle, X } from 'lucide-react'

export const Route = createFileRoute('/_authed/patients/$patientId/')({
  component: LogScreen,
})

const STATUS_CONFIG: Record<DoseStatus, { label: string; dotClass: string; badgeClass: string; icon: typeof Check }> = {
  taken: { label: 'Taken', dotClass: 'status-dot-taken', badgeClass: 'status-taken', icon: Check },
  late: { label: 'Late', dotClass: 'status-dot-late', badgeClass: 'status-late', icon: Clock },
  missed: { label: 'Missed', dotClass: 'status-dot-missed', badgeClass: 'status-missed', icon: X },
  pending: { label: 'Pending', dotClass: 'status-dot-pending', badgeClass: 'status-pending', icon: AlertTriangle },
}

function LogScreen() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId/' })
  // MOCK: Replace with real query
  const schedule = getTodaySchedule(patientId)

  const takenCount = schedule.filter((s) => s.status === 'taken').length
  const totalCount = schedule.length

  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Today's Medications</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-2xl sm:text-3xl font-black text-primary tabular-nums">
            {takenCount}<span className="text-muted-foreground">/{totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-semibold">completed</p>
        </div>
      </div>

      <div className="h-1.5 bg-muted border border-foreground/10 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid gap-3">
        {schedule.map((item, i) => {
          const config = STATUS_CONFIG[item.status]
          const StatusIcon = config.icon
          const loggedByUser = item.log ? getUserById(item.log.loggedBy) : null
          const isPending = item.status === 'pending'

          return (
            <Card
              key={`${item.medication._id}-${item.scheduledHour}-${i}`}
              className={`border-2 rounded-none transition-all animate-card-enter ${
                isPending ? 'border-foreground/80 brutalist-shadow-sm' : 'border-border'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div
                    className={`w-1.5 shrink-0 ${
                      item.status === 'taken'
                        ? 'bg-emerald-500'
                        : item.status === 'late'
                          ? 'bg-amber-500'
                          : item.status === 'missed'
                            ? 'bg-red-500'
                            : 'bg-foreground/20'
                    }`}
                  />
                  <div className="flex-1 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3 className={`text-base sm:text-lg font-bold ${isPending ? '' : 'text-muted-foreground'}`}>
                          {item.medication.name}
                        </h3>
                        <Badge variant="outline" className={`${config.badgeClass} border rounded-none text-xs font-semibold`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="font-mono font-semibold tabular-nums">{item.medication.dosage}</span>
                        <span className="text-border">·</span>
                        <span>Scheduled {formatTime(item.scheduledHour)}</span>
                        {item.log && (
                          <>
                            <span className="text-border hidden sm:inline">·</span>
                            <span className="hidden sm:inline">
                              {item.status === 'missed' ? 'Marked missed' : `Taken ${formatTimestamp(item.log.takenAt)}`}
                            </span>
                          </>
                        )}
                      </div>
                      {loggedByUser && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Logged by {loggedByUser.name}
                        </p>
                      )}
                      {item.log?.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{item.log.notes}"
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <Button
                        size="lg"
                        className="rounded-none h-12 sm:h-14 px-4 sm:px-6 text-sm sm:text-base font-bold gap-2 shrink-0 brutalist-shadow-accent w-full sm:w-auto"
                      >
                        <Check className="h-5 w-5" />
                        Mark as Taken
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {schedule.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-none">
          <p className="text-muted-foreground text-lg">No medications scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add medications in settings to start tracking
          </p>
        </div>
      )}
    </div>
  )
}
