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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Today's Medications</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-black text-primary">
            {takenCount}<span className="text-muted-foreground">/{totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">completed</p>
        </div>
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
              className={`border-2 rounded-none transition-colors ${
                isPending ? 'border-foreground/80' : 'border-border'
              }`}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div
                    className={`w-1.5 ${
                      item.status === 'taken'
                        ? 'bg-emerald-500'
                        : item.status === 'late'
                          ? 'bg-amber-500'
                          : item.status === 'missed'
                            ? 'bg-red-500'
                            : 'bg-border'
                    }`}
                  />
                  <div className="flex-1 p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-lg font-bold ${isPending ? '' : 'text-muted-foreground'}`}>
                          {item.medication.name}
                        </h3>
                        <Badge variant="outline" className={`${config.badgeClass} border rounded-none text-xs font-semibold`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="font-mono font-semibold">{item.medication.dosage}</span>
                        <span>·</span>
                        <span>Scheduled {formatTime(item.scheduledHour)}</span>
                        {item.log && (
                          <>
                            <span>·</span>
                            <span>
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
                        className="rounded-none h-14 px-6 text-base font-bold gap-2 shrink-0"
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
