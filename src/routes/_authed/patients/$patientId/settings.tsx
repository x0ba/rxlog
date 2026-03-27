import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { getPatientMembers, formatTime } from '~/lib/mock-data'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
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
import {
  Archive,
  ArchiveRestore,
  MoreVertical,
  Pill,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  ensurePatientAccessOnClient,
  patientMedicationsQuery,
  patientSummaryQuery,
  patientsListDigestQuery,
  prefetchQueryOnClient,
} from '~/lib/convex-queries'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/_authed/patients/$patientId/settings')({
  loader: async ({ context, params }) => {
    const patientId = params.patientId as Id<'patients'>
    const ensureQueryData = context.queryClient.ensureQueryData.bind(
      context.queryClient,
    )
    const patient = await ensurePatientAccessOnClient(
      ensureQueryData,
      patientId,
    )

    if (!patient) return

    await prefetchQueryOnClient(
      ensureQueryData,
      patientMedicationsQuery(patientId),
    )
  },
  component: SettingsScreen,
})

type AddMedicationFormValues = {
  name: string
  dosage: string
  scheduledTimes: string
}

type MedicationsData = NonNullable<
  typeof api.medications.listMedications._returnType
>
type MedicationWithOptimistic = MedicationsData[number] & {
  optimistic?: boolean
}

function SettingsSectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse border-2 border-border bg-muted/40" />
      <div className="h-20 animate-pulse border-2 border-border bg-muted/30" />
    </div>
  )
}

function AddMedicationDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addMedicationMutationFn = useConvexMutation(
    api.medications.addMedication,
  )
  const { patientId } = Route.useParams()
  const typedPatientId = patientId as Id<'patients'>

  const addMedication = useMutation({
    mutationFn: addMedicationMutationFn,
    onMutate: async (variables) => {
      const query = patientMedicationsQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousMedications =
        queryClient.getQueryData<MedicationsData>(query.queryKey) ?? []
      const optimisticMedication: MedicationWithOptimistic = {
        _id: `optimistic-${crypto.randomUUID()}` as Id<'medications'>,
        _creationTime: Date.now(),
        patientId: typedPatientId,
        name: variables.name,
        dosage: variables.dosage,
        scheduledTimes: variables.scheduledTimes,
        active: true,
        optimistic: true,
      }

      queryClient.setQueryData<MedicationWithOptimistic[]>(
        query.queryKey,
        (current = []) => [optimisticMedication, ...current],
      )

      return { previousMedications, queryKey: query.queryKey }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousMedications)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ?? patientMedicationsQuery(typedPatientId).queryKey,
      })
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      dosage: '',
      scheduledTimes: '',
    } satisfies AddMedicationFormValues,
    onSubmit: async ({ value, formApi }) => {
      await addMedication.mutateAsync({
        name: value.name.trim(),
        patientId: typedPatientId,
        dosage: value.dosage.trim(),
        scheduledTimes: value.scheduledTimes
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean)
          .map((time) => parseInt(time, 10))
          .filter((time) => Number.isFinite(time)),
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
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
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
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
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
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
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
                    .map((segment) => segment.trim())
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
                    Scheduled Times (24-hour format)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-medication-scheduled-times"
                      type="text"
                      placeholder="e.g. 8, 14, 20"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
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
                disabled={isSubmitting || addMedication.isPending}
              >
                {isSubmitting || addMedication.isPending
                  ? 'Creating…'
                  : 'Add Medication'}
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
  const typedPatientId = patientId as Id<'patients'>
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [deletingPatient, setDeletingPatient] = useState(false)
  const archiveMedicationMutationFn = useConvexMutation(
    api.medications.archiveMedication,
  )
  const unarchiveMedicationMutationFn = useConvexMutation(
    api.medications.unarchiveMedication,
  )
  const deleteMedicationMutationFn = useConvexMutation(
    api.medications.deleteMedication,
  )
  const deletePatientMutationFn = useConvexMutation(api.patients.deletePatient)

  const { data: patient } = useQuery(patientSummaryQuery(typedPatientId))
  const members = getPatientMembers(patientId)
  const { data: medicationsData } = useQuery(
    patientMedicationsQuery(typedPatientId),
  )
  const medications = medicationsData as MedicationWithOptimistic[] | undefined

  const archiveMedication = useMutation({
    mutationFn: archiveMedicationMutationFn,
    onMutate: async (variables) => {
      const query = patientMedicationsQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousMedications =
        queryClient.getQueryData<MedicationsData>(query.queryKey) ?? []
      queryClient.setQueryData<MedicationsData>(
        query.queryKey,
        (current = []) =>
          current.map((medication) =>
            medication._id === variables.medicationId
              ? { ...medication, active: false }
              : medication,
          ),
      )

      return { previousMedications, queryKey: query.queryKey }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousMedications)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ?? patientMedicationsQuery(typedPatientId).queryKey,
      })
    },
  })

  const unarchiveMedication = useMutation({
    mutationFn: unarchiveMedicationMutationFn,
    onMutate: async (variables) => {
      const query = patientMedicationsQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousMedications =
        queryClient.getQueryData<MedicationsData>(query.queryKey) ?? []
      queryClient.setQueryData<MedicationsData>(
        query.queryKey,
        (current = []) =>
          current.map((medication) =>
            medication._id === variables.medicationId
              ? { ...medication, active: true }
              : medication,
          ),
      )

      return { previousMedications, queryKey: query.queryKey }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousMedications)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ?? patientMedicationsQuery(typedPatientId).queryKey,
      })
    },
  })

  const deleteMedication = useMutation({
    mutationFn: deleteMedicationMutationFn,
    onMutate: async (variables) => {
      const query = patientMedicationsQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousMedications =
        queryClient.getQueryData<MedicationsData>(query.queryKey) ?? []
      queryClient.setQueryData<MedicationsData>(
        query.queryKey,
        (current = []) =>
          current.filter(
            (medication) => medication._id !== variables.medicationId,
          ),
      )

      return { previousMedications, queryKey: query.queryKey }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousMedications)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ?? patientMedicationsQuery(typedPatientId).queryKey,
      })
    },
  })

  const deletePatient = useMutation({
    mutationFn: deletePatientMutationFn,
    onMutate: async (variables) => {
      const patientsQuery = patientsListDigestQuery()
      await queryClient.cancelQueries({ queryKey: patientsQuery.queryKey })

      const previousPatients =
        queryClient.getQueryData<
          typeof api.patients.listPatientsDigest._returnType
        >(patientsQuery.queryKey) ?? []
      queryClient.setQueryData<
        typeof api.patients.listPatientsDigest._returnType
      >(patientsQuery.queryKey, (current = previousPatients) =>
        current.filter(
          (currentPatient) => currentPatient._id !== variables.patientId,
        ),
      )

      return { previousPatients, patientsQueryKey: patientsQuery.queryKey }
    },
    onError: (error, _variables, context) => {
      setDeletingPatient(false)
      if (!context) {
        window.alert(error.message)
        return
      }
      queryClient.setQueryData(
        context.patientsQueryKey,
        context.previousPatients,
      )
      window.alert(error.message)
    },
    onSuccess: async () => {
      await navigate({ to: '/dashboard' })
    },
    onSettled: async (_data, _error, _variables, context) => {
      if (context) {
        await queryClient.invalidateQueries({
          queryKey: context.patientsQueryKey,
        })
      }
      setDeletingPatient(false)
    },
  })

  const activeMedications =
    medications === undefined
      ? undefined
      : medications.filter((medication) => medication.active)
  const archivedMedications =
    medications === undefined
      ? undefined
      : medications.filter((medication) => !medication.active)

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Patient Info
        </h2>
        {patient === undefined ? (
          <SettingsSectionSkeleton />
        ) : patient === null ? (
          <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
            <p className="text-sm text-muted-foreground">
              Patient not found or you don&apos;t have access.
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
            {patient.role === 'primary' ? (
              <div className="pt-6 border-t-2 border-destructive/40 space-y-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-destructive">
                    Danger zone
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete this patient, all medications, and dose
                    history. This cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-none font-bold w-full sm:w-auto"
                  disabled={deletingPatient}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Delete ${patient.name} and all of their data? This cannot be undone.`,
                      )
                    ) {
                      return
                    }
                    setDeletingPatient(true)
                    void deletePatient.mutateAsync({
                      patientId: typedPatientId,
                    })
                  }}
                >
                  {deletingPatient ? 'Deleting…' : 'Delete patient'}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <Separator className="bg-foreground/80 h-[2px]" />

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
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    They&apos;ll get access to log medications for{' '}
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
              .map((name) => name[0])
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
                {member.role !== 'primary' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-600 rounded-none shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <Separator className="bg-foreground/80 h-[2px]" />

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
            <SettingsSectionSkeleton />
          ) : activeMedications.length === 0 ? (
            <div className="border-2 border-foreground/80 p-4 sm:p-6 brutalist-shadow-sm">
              <p className="text-sm text-muted-foreground">
                No medications yet. Add the first one above.
              </p>
            </div>
          ) : (
            activeMedications.map((medication) => (
              <Card
                key={medication._id}
                className={cn(
                  'border-2 border-border hover:border-foreground/80 transition-all rounded-none brutalist-shadow-sm',
                  medication.optimistic ? 'opacity-80' : '',
                )}
              >
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary flex items-center justify-center shrink-0">
                    <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base">
                        {medication.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-none font-mono text-xs"
                      >
                        {medication.dosage}
                      </Badge>
                      {medication.optimistic ? (
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[10px] sm:text-xs uppercase tracking-wider"
                        >
                          Saving
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                      {medication.scheduledTimes
                        .map((hour) => formatTime(hour))
                        .join(' · ')}
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
                        disabled={medication.optimistic}
                        onClick={() => {
                          void archiveMedication.mutateAsync({
                            medicationId: medication._id,
                          })
                        }}
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={medication.optimistic}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete ${medication.name}? This cannot be undone.`,
                            )
                          ) {
                            return
                          }
                          void deleteMedication.mutateAsync({
                            medicationId: medication._id,
                          })
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

          {archivedMedications !== undefined &&
          archivedMedications.length > 0 ? (
            <div className="pt-5 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Archived
                </h3>
                <p className="text-xs text-muted-foreground">
                  Shown for reference
                </p>
              </div>

              {archivedMedications.map((medication) => (
                <Card
                  key={medication._id}
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
                          {medication.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-none font-mono text-xs"
                        >
                          {medication.dosage}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[10px] sm:text-xs uppercase tracking-wider"
                        >
                          Archived
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                        {medication.scheduledTimes
                          .map((hour) => formatTime(hour))
                          .join(' · ')}
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
                            void unarchiveMedication.mutateAsync({
                              medicationId: medication._id,
                            })
                          }}
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          Unarchive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Delete ${medication.name}? This cannot be undone.`,
                              )
                            ) {
                              return
                            }
                            void deleteMedication.mutateAsync({
                              medicationId: medication._id,
                            })
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
