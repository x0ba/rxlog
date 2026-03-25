import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import {
  MOCK_PATIENTS,
  getPatientLogs,
  getPatientMedications,
  getMedicationById,
  getUserById,
  formatTimestamp,
  formatDate,
  formatTime,
  getDoseStatus,
} from '~/lib/mock-data'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { FileDown, Eye, Check, Clock, X } from 'lucide-react'

export const Route = createFileRoute('/_authed/patients/$patientId/export')({
  component: ExportScreen,
})

function ExportScreen() {
  const { patientId } = useParams({ from: '/_authed/patients/$patientId/export' })

  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0]!)
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]!)
  const [showPreview, setShowPreview] = useState(false)

  // MOCK: Replace with real queries
  const patient = MOCK_PATIENTS.find((p) => p._id === patientId)
  const allLogs = getPatientLogs(patientId)
  const medications = getPatientMedications(patientId)

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const filteredLogs = allLogs
    .filter((l) => l.takenAt >= start.getTime() && l.takenAt <= end.getTime())
    .sort((a, b) => a.takenAt - b.takenAt)

  const missedCount = filteredLogs.filter((l) => l.missed).length
  const lateCount = filteredLogs.filter((l) => {
    if (l.missed) return false
    const med = getMedicationById(l.medicationId)
    if (!med) return false
    const takenHour = new Date(l.takenAt).getHours()
    return med.scheduledTimes.some((h) => Math.abs(takenHour - h) > 1)
  }).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-black tracking-tight">Export Report</h2>

      <div className="border-2 border-foreground/80 p-4 sm:p-6 space-y-4 sm:space-y-6 brutalist-shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-none border-2 border-foreground/80 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-none border-2 border-foreground/80 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="rounded-none border-2 border-foreground/80 font-bold gap-2 w-full sm:w-auto"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Button className="rounded-none font-bold gap-2 brutalist-shadow-accent w-full sm:w-auto">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="border-2 border-foreground/80 bg-white">
          {/* PDF Preview Header */}
          <div className="p-4 sm:p-8 border-b-2 border-foreground/80">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black">Medication Report</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
                  Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="font-black text-base sm:text-lg">{patient?.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                  DOB: {patient?.birthDate}
                </p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm font-mono text-muted-foreground">
              Period: {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' — '}
              {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 sm:p-8 border-b-2 border-foreground/80">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="font-mono text-xl sm:text-2xl font-black">{filteredLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total doses</p>
              </div>
              <div>
                <p className="font-mono text-xl sm:text-2xl font-black text-emerald-600">
                  {filteredLogs.length - missedCount - lateCount}
                </p>
                <p className="text-xs text-muted-foreground">On time</p>
              </div>
              <div>
                <p className="font-mono text-xl sm:text-2xl font-black text-amber-600">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div>
                <p className="font-mono text-xl sm:text-2xl font-black text-red-600">{missedCount}</p>
                <p className="text-xs text-muted-foreground">Missed</p>
              </div>
            </div>

            {missedCount > 0 && (
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-200">
                <p className="text-xs sm:text-sm font-bold text-red-800">
                  {missedCount} missed dose{missedCount !== 1 ? 's' : ''} during this period
                </p>
                <ul className="mt-1 text-xs sm:text-sm text-red-700">
                  {filteredLogs
                    .filter((l) => l.missed)
                    .map((l) => {
                      const med = getMedicationById(l.medicationId)
                      return (
                        <li key={l._id} className="font-mono break-all sm:break-normal">
                          · {med?.name} — {formatDate(l.takenAt)}{l.notes ? ` (${l.notes})` : ''}
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}
          </div>

          {/* Medications list */}
          <div className="p-4 sm:p-8 border-b-2 border-foreground/80">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Active Medications</h4>
            <div className="grid gap-2">
              {medications.map((med) => (
                <div key={med._id} className="flex items-center justify-between text-sm py-1 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                    <span className="font-bold">{med.name}</span>
                    <Badge variant="outline" className="rounded-none font-mono text-xs">
                      {med.dosage}
                    </Badge>
                  </div>
                  <span className="font-mono text-muted-foreground text-xs sm:text-sm shrink-0">
                    {med.scheduledTimes.map((h) => formatTime(h)).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dose log table */}
          <div className="p-4 sm:p-8">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Dose Log</h4>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="border-b-2 border-foreground/80">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Medication</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Scheduled</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Actual</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Logged By</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const med = getMedicationById(log.medicationId)
                  const user = getUserById(log.loggedBy)
                  if (!med) return null

                  const scheduledHour = med.scheduledTimes.reduce((closest, h) =>
                    Math.abs(new Date(log.takenAt).getHours() - h) <
                    Math.abs(new Date(log.takenAt).getHours() - closest)
                      ? h
                      : closest
                  )
                  const status = getDoseStatus(scheduledHour, log)

                  return (
                    <TableRow key={log._id} className="font-mono text-sm">
                      <TableCell>{formatDate(log.takenAt)}</TableCell>
                      <TableCell className="font-sans font-semibold">{med.name} {med.dosage}</TableCell>
                      <TableCell>{formatTime(scheduledHour)}</TableCell>
                      <TableCell>{log.missed ? '—' : formatTimestamp(log.takenAt)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          {status === 'taken' && <Check className="h-3 w-3 text-emerald-600" />}
                          {status === 'late' && <Clock className="h-3 w-3 text-amber-600" />}
                          {status === 'missed' && <X className="h-3 w-3 text-red-600" />}
                          <span
                            className={
                              status === 'taken'
                                ? 'text-emerald-700'
                                : status === 'late'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                            }
                          >
                            {status === 'taken' ? 'On time' : status === 'late' ? 'Late' : 'Missed'}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="font-sans">{user?.name ?? '—'}</TableCell>
                      <TableCell className="font-sans text-muted-foreground italic">
                        {log.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
