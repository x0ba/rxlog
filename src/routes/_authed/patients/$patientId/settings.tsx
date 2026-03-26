import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { getPatientMembers, formatTime } from '~/lib/mock-data'
import { useQuery, useMutation } from 'convex/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
} from '~/components/ui/field'
import { useForm } from '@tanstack/react-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Archive, MoreVertical, Plus, Trash2, UserPlus, Pill } from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authed/patients/$patientId/settings')({
  component: SettingsScreen,
})

type AddMedicationFormValues = {
  name: string
  dosage: string
  scheduledTimes: string
}

function AddMedicationDialog() {
  const [open, setOpen] = useState(false)
  const addMedication = useMutation(api.medications.addMedication)
  const { patientId } = Route.useParams()

  const defaultValues: AddMedicationFormValues = {
    name: '',
    dosage: '',
    scheduledTimes: '',
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await addMedication({
        name: value.name.trim(),
        patientId: patientId as Id<'patients'>,
        dosage: value.dosage.trim(),
        scheduledTimes: value.scheduledTimes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((t) => parseInt(t, 10))
          .filter((n) => Number.isFinite(n)),
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
        Add Medication
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            Add Medication
          </DialogTitle>
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
                    ? 'Medication name is required'
                    : undefined,
              }}
            >
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel
                    htmlFor="add-medication-name"
                    className="text-sm font-semibold"
                  >
                    Medication Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-medication-name"
                      type="text"
                      placeholder="e.g. Paracetamol"
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
              name="dosage"
              validators={{
                onSubmit: ({ value }) =>
                  value.trim().length === 0 ? 'Dosage is required' : undefined,
              }}
            >
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel
                    htmlFor="add-medication-dosage"
                    className="text-sm font-semibold"
                  >
                    Dosage
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-medication-dosage"
                      type="text"
                      placeholder="e.g. 100mg"
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
              name="scheduledTimes"
              validators={{
                onSubmit: ({ value }) =>
                  value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean).length === 0
                    ? 'Scheduled times are required'
                    : undefined,
              }}
            >
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0 || undefined}
                >
                  <FieldLabel
                    htmlFor="add-medication-scheduled-times"
                    className="text-sm font-semibold"
                  >
                    Scheduled Times
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-medication-scheduled-times"
                      type="text"
                      placeholder="e.g. 8, 14, 20"
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
                {isSubmitting ? 'Creating…' : 'Add Medication'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingsScreen() {
  const { patientId } = useParams({
    from: '/_authed/patients/$patientId/settings',
  })
  const [inviteEmail, setInviteEmail] = useState('')
  const archiveMedication = useMutation(api.medications.archiveMedication)
  const deleteMedication = useMutation(api.medications.deleteMedication)

  const patient = useQuery(api.patients.getPatient, {
    patientId: patientId as Id<'patients'>,
  })
  const members = getPatientMembers(patientId)
  const medications = useQuery(api.medications.listMedications, {
    patientId: patientId as Id<'patients'>,
  })
  const activeMedications =
    medications === undefined ? undefined : medications.filter((m) => m.active)
  const archivedMedications =
    medications === undefined
      ? undefined
      : medications.filter((m) => !m.active)

  return (
    <div className="space-y-10">
      {/* Patient Info */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Patient Info
        </h2>
        {patient === undefined ? (
          <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
            <p className="text-sm text-muted-foreground">Loading patient…</p>
          </div>
        ) : patient === null ? (
          <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
            <p className="text-sm text-muted-foreground">
              Patient not found or you don't have access.
            </p>
          </div>
        ) : (
          <div className="border-2 border-foreground/80 p-4 sm:p-6 space-y-4 brutalist-shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <Input
                  defaultValue={patient.name}
                  className="rounded-none border-2 border-foreground/80 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  defaultValue={patient.birthDate}
                  className="rounded-none border-2 border-foreground/80 font-mono"
                />
              </div>
            </div>
            <Button className="rounded-none font-bold w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        )}
      </section>

      <Separator className="bg-foreground/80 h-[2px]" />

      {/* Caretakers */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Caretakers
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              People who can log medications for this patient
            </p>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button className="gap-2 rounded-none font-bold brutalist-shadow-accent w-full sm:w-auto shrink-0" />
              }
            >
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
                    They'll get access to log medications for {patient?.name}
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
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-border hover:border-foreground/80 transition-all hover:translate-x-1 duration-150"
              >
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 rounded-none border-2 border-foreground/80 shrink-0">
                  <AvatarFallback className="rounded-none text-xs sm:text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate">
                    {member.user.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">
                    {member.user.email}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-none font-semibold uppercase text-[10px] sm:text-xs tracking-wider shrink-0 hidden sm:inline-flex"
                >
                  {member.role}
                </Badge>
                {member.role !== 'primary' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-600 rounded-none shrink-0"
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Medications
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Active prescriptions and their schedules
            </p>
          </div>
          <AddMedicationDialog />
        </div>

        <div className="space-y-2">
          {activeMedications === undefined ? (
            <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
              <p className="text-sm text-muted-foreground">
                Loading medications…
              </p>
            </div>
          ) : activeMedications.length === 0 ? (
            <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
              <p className="text-sm text-muted-foreground">
                No medications yet. Add the first one above.
              </p>
            </div>
          ) : (
            activeMedications.map((med) => (
              <Card
                key={med._id}
                className="border-2 border-border hover:border-foreground/80 transition-all rounded-none brutalist-shadow-sm"
              >
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary flex items-center justify-center shrink-0">
                    <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base">
                        {med.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-none font-mono text-xs"
                      >
                        {med.dosage}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                      {med.scheduledTimes.map((h) => formatTime(h)).join(' · ')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground rounded-none shrink-0"
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          void archiveMedication({ medicationId: med._id })
                        }}
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete ${med.name}? This cannot be undone.`,
                            )
                          ) {
                            return
                          }
                          void deleteMedication({ medicationId: med._id })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))
          )}

          {archivedMedications !== undefined && archivedMedications.length > 0 ? (
            <div className="pt-5 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Archived
                </h3>
                <p className="text-xs text-muted-foreground">
                  Shown for reference
                </p>
              </div>

              {archivedMedications.map((med) => (
                <Card
                  key={med._id}
                  className={cn(
                    'border-2 border-border rounded-none brutalist-shadow-sm',
                    'bg-muted/25 opacity-70',
                  )}
                >
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 bg-muted flex items-center justify-center shrink-0 border border-border">
                      <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-muted-foreground">
                          {med.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-none font-mono text-xs"
                        >
                          {med.dosage}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[10px] sm:text-xs uppercase tracking-wider"
                        >
                          Archived
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                        {med.scheduledTimes.map((h) => formatTime(h)).join(' · ')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground rounded-none shrink-0"
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Archive className="h-4 w-4" />
                          Archived
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Delete ${med.name}? This cannot be undone.`,
                              )
                            ) {
                              return
                            }
                            void deleteMedication({ medicationId: med._id })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
