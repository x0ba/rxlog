import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getPatientLogs,
  getPatientMedications,
  getMedicationById,
  getUserById,
  formatTimestamp,
  formatDateFull,
  getDoseStatus,
  type DoseStatus,
  type MockLog,
} from '~/lib/mock-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { Check, Clock, X } from 'lucide-react'

export const Route = createFileRoute('/_authed/patients/$patientId/history')({
  component: HistoryScreen,
})

const STATUS_STYLES: Record<DoseStatus, { bg: string; text: string; icon: typeof Check }> = {
  taken: { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: Check },
  late: { bg: 'bg-amber-500', text: 'text-amber-700', icon: Clock },
  missed: { bg: 'bg-red-500', text: 'text-red-700', icon: X },
  pending: { bg: 'bg-gray-400', text: 'text-gray-500', icon: Clock },
}

function HistoryScreen() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId/history' })
  const [selectedMed, setSelectedMed] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7')

  // MOCK: Replace with real queries
  const allLogs = getPatientLogs(patientId)
  const medications = getPatientMedications(patientId)

  const daysBack = parseInt(dateRange)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(0, 0, 0, 0)

  const filteredLogs = allLogs.filter((log) => {
    if (log.takenAt < cutoff.getTime()) return false
    if (selectedMed !== 'all' && log.medicationId !== selectedMed) return false
    return true
  })

  const logsByDay = groupLogsByDay(filteredLogs)

  const stats = {
    total: filteredLogs.length,
    taken: filteredLogs.filter((l) => !l.missed).length,
    missed: filteredLogs.filter((l) => l.missed).length,
  }
  const lateCount = filteredLogs.filter((l) => {
    if (l.missed) return false
    const med = getMedicationById(l.medicationId)
    if (!med) return false
    const takenHour = new Date(l.takenAt).getHours()
    return med.scheduledTimes.some((h) => Math.abs(takenHour - h) > 1 && Math.abs(takenHour - h) <= 3)
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">History</h2>
        <div className="flex gap-2 sm:gap-3">
          <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
            <SelectTrigger className="w-[120px] sm:w-[140px] rounded-none border-2 border-foreground/80 font-semibold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMed} onValueChange={(v) => v && setSelectedMed(v)}>
            <SelectTrigger className="flex-1 sm:w-[180px] rounded-none border-2 border-foreground/80 font-semibold text-sm min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All medications</SelectItem>
              {medications.map((med) => (
                <SelectItem key={med._id} value={med._id}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 border-2 border-foreground/80 brutalist-shadow animate-card-enter">
        <div className="stat-block p-3 sm:p-5 text-center border-r-2 border-foreground/80 bg-emerald-50 text-emerald-700">
          <p className="font-mono text-2xl sm:text-3xl font-black tabular-nums">{stats.taken}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] font-semibold text-emerald-600/70 mt-1">On time</p>
        </div>
        <div className="stat-block p-3 sm:p-5 text-center border-r-2 border-foreground/80 bg-amber-50 text-amber-700">
          <p className="font-mono text-2xl sm:text-3xl font-black tabular-nums">{lateCount}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] font-semibold text-amber-600/70 mt-1">Late</p>
        </div>
        <div className="stat-block p-3 sm:p-5 text-center bg-red-50 text-red-700">
          <p className="font-mono text-2xl sm:text-3xl font-black tabular-nums">{stats.missed}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] font-semibold text-red-600/70 mt-1">Missed</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(logsByDay).map(([dateKey, dayLogs]) => {
          const dayDate = new Date(dateKey)
          return (
            <div key={dateKey}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {formatDateFull(dayDate.getTime())}
              </h3>
              <div className="space-y-2">
                {dayLogs.map((log) => {
                  const med = getMedicationById(log.medicationId)
                  const user = getUserById(log.loggedBy)
                  if (!med) return null

                  const scheduledHour = med.scheduledTimes.reduce((closest, h) =>
                    Math.abs(new Date(log.takenAt).getHours() - h) < Math.abs(new Date(log.takenAt).getHours() - closest)
                      ? h
                      : closest
                  )
                  const status = getDoseStatus(scheduledHour, log)
                  const style = STATUS_STYLES[status]
                  const StatusIcon = style.icon

                  return (
                    <div key={log._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-border hover:border-foreground/80 transition-all hover:translate-x-1 duration-150">
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 ${style.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base">{med.name}</span>
                          <Badge variant="outline" className="rounded-none text-xs font-mono">
                            {med.dosage}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {log.missed ? 'Missed' : `Taken at ${formatTimestamp(log.takenAt)}`}
                          {user && <span className="hidden sm:inline"> · by {user.name}</span>}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{log.notes}"</p>
                        )}
                      </div>
                      <span className="font-mono text-xs sm:text-sm text-muted-foreground shrink-0 hidden sm:block">
                        {formatTimestamp(log.takenAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border">
          <p className="text-muted-foreground text-lg">No logs found</p>
          <p className="text-sm text-muted-foreground mt-1">Try changing the date range or filter</p>
        </div>
      )}
    </div>
  )
}

function groupLogsByDay(logs: MockLog[]): Record<string, MockLog[]> {
  const groups: Record<string, MockLog[]> = {}
  const sorted = [...logs].sort((a, b) => b.takenAt - a.takenAt)

  for (const log of sorted) {
    const d = new Date(log.takenAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }

  return groups
}
