import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import {
  MOCK_PATIENTS,
  getPatientMembers,
  getPatientMedications,
  formatTime,
} from '~/lib/mock-data'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Plus, Trash2, UserPlus, Pill } from 'lucide-react'

export const Route = createFileRoute(
  '/_authed/patients/$patientId/settings',
)({
  component: SettingsScreen,
})

function SettingsScreen() {
  const { patientId } = useParams({
    from: '/_authed/patients/$patientId/settings',
  })
  const [inviteEmail, setInviteEmail] = useState('')

  // MOCK: Replace with real queries
  const patient = MOCK_PATIENTS.find((p) => p._id === patientId)
  const members = getPatientMembers(patientId)
  const medications = getPatientMedications(patientId)

  return (
    <div className="space-y-10">
      {/* Patient Info */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight">Patient Info</h2>
        <div className="border-2 border-foreground/80 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider">
                Full Name
              </label>
              <Input
                defaultValue={patient?.name}
                className="rounded-none border-2 border-foreground/80 font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider">
                Date of Birth
              </label>
              <Input
                type="date"
                defaultValue={patient?.birthDate}
                className="rounded-none border-2 border-foreground/80 font-mono"
              />
            </div>
          </div>
          <Button className="rounded-none font-bold">Save Changes</Button>
        </div>
      </section>

      <Separator className="bg-foreground/80 h-[2px]" />

      {/* Caretakers */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Caretakers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              People who can log medications for this patient
            </p>
          </div>
          <Dialog>
            <DialogTrigger render={<Button className="gap-2 rounded-none font-bold" />}>
              <UserPlus className="h-4 w-4" />
              Invite
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  Invite Caretaker
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <Input
                    type="email"
                    placeholder="caretaker@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    They'll get access to log medications for{' '}
                    {patient?.name}
                  </p>
                </div>
                <Button className="w-full rounded-none font-bold">
                  Send Invite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const initials = member.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')

            return (
              <div
                key={member._id}
                className="flex items-center gap-4 p-4 border-2 border-border hover:border-foreground/80 transition-colors"
              >
                <Avatar className="h-10 w-10 rounded-none border-2 border-foreground/80">
                  <AvatarFallback className="rounded-none text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {member.user.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-none font-semibold uppercase text-xs tracking-wider"
                >
                  {member.role}
                </Badge>
                {member.role !== 'primary' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-600 rounded-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Separator className="bg-foreground/80 h-[2px]" />

      {/* Medications */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Medications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Active prescriptions and their schedules
            </p>
          </div>
          <Dialog>
            <DialogTrigger render={<Button className="gap-2 rounded-none font-bold" />}>
              <Plus className="h-4 w-4" />
              Add Medication
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  Add Medication
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Medication Name
                  </label>
                  <Input placeholder="e.g. Lisinopril" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Dosage</label>
                  <Input placeholder="e.g. 10mg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Scheduled Times
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Comma-separated hours in 24h format (e.g. 8, 14, 20)
                  </p>
                  <Input placeholder="8, 20" className="font-mono" />
                </div>
                <Button className="w-full rounded-none font-bold">
                  Add Medication
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {medications.map((med) => (
            <Card
              key={med._id}
              className="border-2 border-border hover:border-foreground/80 transition-colors rounded-none"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-primary flex items-center justify-center shrink-0">
                  <Pill className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{med.name}</span>
                    <Badge
                      variant="outline"
                      className="rounded-none font-mono text-xs"
                    >
                      {med.dosage}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">
                    {med.scheduledTimes.map((h) => formatTime(h)).join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-600 rounded-none"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
