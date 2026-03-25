import { createFileRoute, Link } from '@tanstack/react-router'
import { MOCK_PATIENTS, getPatientMedications, getPatientMembers } from '~/lib/mock-data'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Plus, ChevronRight, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">Select a patient to manage medications</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="h-4 w-4" />
            Add Patient
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-black">New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input placeholder="e.g. Dorothy Williams" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Date of Birth</label>
                <Input type="date" />
              </div>
              <Button className="w-full">Create Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {MOCK_PATIENTS.map((patient) => {
          const meds = getPatientMedications(patient._id)
          const members = getPatientMembers(patient._id)
          const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
          const initials = patient.name
            .split(' ')
            .map((n) => n[0])
            .join('')

          return (
            <Link
              key={patient._id}
              to="/patients/$patientId"
              params={{ patientId: patient._id }}
              className="block group"
            >
              <Card className="border-2 border-foreground/80 hover:bg-secondary transition-colors rounded-none">
                <CardContent className="p-6 flex items-center gap-6">
                  <Avatar className="h-14 w-14 rounded-none border-2 border-foreground/80">
                    <AvatarFallback className="rounded-none text-lg font-black bg-accent text-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black tracking-tight">{patient.name}</h2>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="font-mono">{age} years old</span>
                      <span>·</span>
                      <span>{meds.length} active medication{meds.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{members.length}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
