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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">Dashboard</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">Select a patient to manage medications</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="gap-2 brutalist-shadow-accent w-full sm:w-auto shrink-0" />}>
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

      <div className="grid gap-5">
        {MOCK_PATIENTS.map((patient, index) => {
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
              className="block group animate-card-enter"
              style={{ animationDelay: `${index * 80 + 100}ms` }}
            >
              <Card className="accent-stripe border-2 border-foreground/80 brutalist-shadow rounded-none overflow-hidden">
                <CardContent className="p-0 flex items-stretch">
                  <div className="pl-4 sm:pl-7 pr-2 py-4 sm:py-6 flex items-center">
                    <Avatar className="h-10 w-10 sm:h-14 sm:w-14 rounded-none border-2 border-foreground/80 brutalist-shadow-sm">
                      <AvatarFallback className="rounded-none text-sm sm:text-lg font-black bg-accent text-accent-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0 py-4 sm:py-6 px-3 sm:px-4">
                    <h2 className="text-base sm:text-xl font-black tracking-tight group-hover:text-primary transition-colors truncate">{patient.name}</h2>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground">
                      <span className="font-mono tabular-nums">{age}y</span>
                      <span className="text-border">·</span>
                      <span>{meds.length} med{meds.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-6">
                    <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-mono tabular-nums">{members.length}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
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
