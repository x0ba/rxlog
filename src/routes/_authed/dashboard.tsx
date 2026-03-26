import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/_authed/dashboard')({
  component: Dashboard,
})

function AddPatientDialog() {
  const [open, setOpen] = useState(false)
  const addPatient = useMutation(api.patients.addPatient)

  const form = useForm({
    defaultValues: {
      name: '',
      birthDate: '',
    },
    onSubmit: async ({ value, formApi }) => {
      await addPatient({
        name: value.name.trim(),
        birthDate: value.birthDate,
      })
      formApi.reset()
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 brutalist-shadow-accent w-full sm:w-auto shrink-0" />
        }
      >
        <Plus className="h-4 w-4" />
        Add Patient
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-black">New Patient</DialogTitle>
        </DialogHeader>
        <form
          className="pt-2"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field
              name="name"
              validators={{
                onSubmit: ({ value }) =>
                  value.trim().length === 0
                    ? 'Full name is required'
                    : undefined,
              }}
            >
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel
                    htmlFor="add-patient-name"
                    className="text-sm font-semibold"
                  >
                    Full Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-patient-name"
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError>
                      {field.state.meta.errors[0] != null
                        ? String(field.state.meta.errors[0])
                        : null}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field
              name="birthDate"
              validators={{
                onSubmit: ({ value }) =>
                  value.length === 0 ? 'Date of birth is required' : undefined,
              }}
            >
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel
                    htmlFor="add-patient-dob"
                    className="text-sm font-semibold"
                  >
                    Date of Birth
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-patient-dob"
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError>
                      {field.state.meta.errors[0] != null
                        ? String(field.state.meta.errors[0])
                        : null}
                    </FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating…' : 'Create Patient'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Dashboard() {
  const patients = useQuery(api.patients.listPatients)

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">
            Dashboard
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Patients
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">
            Select a patient to manage medications
          </p>
        </div>
        <AddPatientDialog />
      </div>

      <div className="grid gap-5">
        {patients === undefined ? (
          <p className="text-sm text-muted-foreground">Loading patients…</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No patients yet. Add one with the button above.
          </p>
        ) : (
          patients.map((patient, index) => {
            const age =
              new Date().getFullYear() -
              new Date(patient.birthDate).getFullYear()
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
                      <h2 className="text-base sm:text-xl font-black tracking-tight group-hover:text-primary transition-colors truncate">
                        {patient.name}
                      </h2>
                      <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="font-mono tabular-nums">{age}y</span>
                        <span className="text-border">·</span>
                        <span>0 meds</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-6">
                      <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="font-mono tabular-nums">
                          {patient.memberCount}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
