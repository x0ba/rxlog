import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import {
  Archive,
  ArchiveRestore,
  MoreVertical,
  Pill,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  ensurePatientAccessOnClient,
  patientMedicationsQuery,
  patientSummaryQuery,
  patientTeamQuery,
  patientsListDigestQuery,
  prefetchQueryOnClient,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'
import {
  getEarliestAllowedPatientBirthDate,
  getLatestAllowedPatientBirthDate,
} from '~/lib/patient-birth-date'

export const Route = createFileRoute(
  '/_authed/dashboard/patients/$patientId/settings',
)({
  loader: async ({ context, params }) => {
    await waitForAuthedAppReady({
      convexClient: context.convexClient,
      queryClient: context.queryClient,
    })
    const patientId = params.patientId as Id<'patients'>
    const ensureQueryData = context.queryClient.ensureQueryData.bind(
      context.queryClient,
    )
    const patient = await ensurePatientAccessOnClient(
      ensureQueryData,
      patientId,
    )

    if (!patient) return

    await Promise.all([
      prefetchQueryOnClient(
        ensureQueryData,
        patientMedicationsQuery(patientId),
      ),
      prefetchQueryOnClient(ensureQueryData, patientTeamQuery(patientId)),
    ])
  },
  component: SettingsScreen,
})

type AddMedicationFormValues = {
  name: string
  dosage: string
  scheduledTimes: string
}

const scheduledTimesValidationMessage =
  'Enter one or more whole hours between 0 and 23, separated by commas'

function parseScheduledTimes(value: string) {
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => Number(segment))
}

function getScheduledTimesValidationError(value: string) {
  const scheduledTimes = parseScheduledTimes(value)

  if (scheduledTimes.length === 0) {
    return scheduledTimesValidationMessage
  }

  if (
    scheduledTimes.some(
      (scheduledTime) =>
        !Number.isInteger(scheduledTime) ||
        scheduledTime < 0 ||
        scheduledTime > 23,
    )
  ) {
    return scheduledTimesValidationMessage
  }
}

type MedicationsData = NonNullable<
  typeof api.medications.listMedications._returnType
>
type PatientTeamData = NonNullable<
  typeof api.invites.getPatientTeam._returnType
>
type TeamMember = PatientTeamData['members'][number]
type MedicationWithOptimistic = MedicationsData[number] & {
  optimistic?: boolean
}

const inviteDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatScheduledHour(hour: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const normalizedHour = hour % 12 || 12
  return `${normalizedHour}:00 ${ampm}`
}

function formatInviteDate(value: number) {
  return inviteDateFormatter.format(new Date(value))
}

function getMemberLabel(member: PatientTeamData['members'][number]) {
  return member.user.name || member.user.email || 'Unknown member'
}

function getMemberInitials(member: PatientTeamData['members'][number]) {
  const label = getMemberLabel(member)
  const words = label.split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  return initials || '?'
}

function formatMemberRole(role: TeamMember['role']) {
  return role === 'primary' ? 'Primary' : 'Caretaker'
}

function isMemberRole(value: string): value is TeamMember['role'] {
  return value === 'primary' || value === 'caretaker'
}

function sortTeamMembers(
  members: Array<TeamMember>,
  viewerUserId: PatientTeamData['viewerUserId'],
) {
  return [...members].sort((a, b) => {
    if (a.userId !== b.userId) {
      if (a.userId === viewerUserId) return -1
      if (b.userId === viewerUserId) return 1
    }

    const aLabel = (a.user.name || a.user.email).toLowerCase()
    const bLabel = (b.user.name || b.user.email).toLowerCase()
    return aLabel.localeCompare(bLabel)
  })
}

function SettingsSectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="border-border bg-muted/40 h-24 animate-pulse rounded-2xl border" />
      <div className="border-border bg-muted/30 h-20 animate-pulse rounded-xl border" />
    </div>
  )
}

function TeamSectionSkeleton() {
  return (
    <div className="space-y-2">
      <div className="border-border bg-muted/30 h-20 animate-pulse rounded-xl border" />
      <div className="border-border bg-muted/20 h-20 animate-pulse rounded-xl border" />
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

      queryClient.setQueryData<Array<MedicationWithOptimistic>>(
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
      const scheduledTimes = parseScheduledTimes(value.scheduledTimes)

      await addMedication.mutateAsync({
        name: value.name.trim(),
        patientId: typedPatientId,
        dosage: value.dosage.trim(),
        scheduledTimes,
      })
      formApi.reset()
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full shrink-0 gap-2 rounded-xl shadow-sm sm:w-auto" />
        }
      >
        <Plus className="h-4 w-4" />
        Add Medication
      </DialogTrigger>
      <DialogContent className="border-border rounded-2xl border sm:max-w-md">
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
                  getScheduledTimesValidationError(value),
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
                className="mt-4 w-full rounded-xl"
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

function InviteCaretakerDialog({
  patientId,
  patientName,
}: {
  patientId: Id<'patients'>
  patientName?: string
}) {
  const [open, setOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const createInviteMutationFn = useConvexMutation(api.invites.createInvite)
  const normalizedInviteEmail = inviteEmail.trim().toLowerCase()

  const createInvite = useMutation({
    mutationFn: createInviteMutationFn,
    onSuccess: () => {
      setInviteEmail('')
      setInviteError(null)
      setOpen(false)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: patientTeamQuery(patientId).queryKey,
      })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setInviteEmail('')
          setInviteError(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="w-full shrink-0 gap-2 rounded-xl font-bold shadow-sm sm:w-auto" />
        }
      >
        <UserPlus className="h-4 w-4" />
        Invite
      </DialogTrigger>
      <DialogContent className="border-border rounded-2xl border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            Invite Caretaker
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setInviteError(null)

            if (normalizedInviteEmail.length === 0) {
              setInviteError('Email address is required.')
              return
            }

            void createInvite
              .mutateAsync({
                email: normalizedInviteEmail,
                patientId,
              })
              .catch((error) => {
                setInviteError(
                  error instanceof Error
                    ? error.message
                    : 'Unable to send invite.',
                )
              })
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="invite-caretaker-email"
              className="text-sm font-semibold"
            >
              Email Address
            </label>
            <Input
              id="invite-caretaker-email"
              type="email"
              placeholder="caretaker@example.com"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value)
                if (inviteError) {
                  setInviteError(null)
                }
              }}
              required
            />
            <p className="text-muted-foreground text-xs">
              They&apos;ll get access to log medications for{' '}
              {patientName ?? 'this patient'}.
            </p>
            {inviteError ? (
              <p className="text-destructive text-sm font-medium">
                {inviteError}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl font-bold"
            disabled={
              normalizedInviteEmail.length === 0 || createInvite.isPending
            }
          >
            {createInvite.isPending ? 'Sending…' : 'Send Invite'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingsScreen() {
  const { patientId } = useParams({
    from: '/_authed/dashboard/patients/$patientId/settings',
  })
  const typedPatientId = patientId as Id<'patients'>
  const earliestAllowedBirthDate = getEarliestAllowedPatientBirthDate()
  const latestAllowedBirthDate = getLatestAllowedPatientBirthDate()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const updateRoleMutationFn = useConvexMutation(api.patientMembers.updateRole)

  const { data: patient } = useQuery(patientSummaryQuery(typedPatientId))
  const { data: teamData } = useQuery(patientTeamQuery(typedPatientId))
  const { data: medicationsData } = useQuery(
    patientMedicationsQuery(typedPatientId),
  )
  const medications = medicationsData as
    | Array<MedicationWithOptimistic>
    | undefined
  const members = teamData?.members ?? []
  const pendingInvites = teamData?.pendingInvites ?? []
  const viewerUserId = teamData?.viewerUserId
  const isPrimaryMember = patient?.role === 'primary'
  const [pendingRoleMemberId, setPendingRoleMemberId] =
    useState<Id<'patientMembers'> | null>(null)
  const [teamRoleError, setTeamRoleError] = useState<string | null>(null)

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

  const updateMemberRole = useMutation({
    mutationFn: updateRoleMutationFn,
    onMutate: async (variables) => {
      setPendingRoleMemberId(variables.memberId)
      setTeamRoleError(null)

      const query = patientTeamQuery(typedPatientId)
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousTeamData = queryClient.getQueryData<PatientTeamData>(
        query.queryKey,
      )

      queryClient.setQueryData<PatientTeamData | undefined>(
        query.queryKey,
        (current) => {
          if (!current) return current

          return {
            ...current,
            members: sortTeamMembers(
              current.members.map((member) =>
                member._id === variables.memberId
                  ? { ...member, role: variables.role }
                  : member,
              ),
              current.viewerUserId,
            ),
          }
        },
      )

      return { previousTeamData, queryKey: query.queryKey }
    },
    onError: (error, _variables, context) => {
      if (context?.previousTeamData) {
        queryClient.setQueryData(context.queryKey, context.previousTeamData)
      }

      setTeamRoleError(error.message)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ?? patientTeamQuery(typedPatientId).queryKey,
      })
      setPendingRoleMemberId(null)
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
        <div>
          <p className="section-label mb-2">Configuration</p>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Patient Info
          </h2>
        </div>
        {patient === undefined ? (
          <SettingsSectionSkeleton />
        ) : patient === null ? (
          <div className="border-border bg-card rounded-2xl border p-4 shadow-sm sm:p-6">
            <p className="text-muted-foreground text-sm">
              Patient not found or you don&apos;t have access.
            </p>
          </div>
        ) : (
          <div className="border-border bg-card space-y-4 rounded-2xl border p-4 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black tracking-[0.2em] uppercase">
                  Full Name
                </label>
                <Input
                  defaultValue={patient.name}
                  className="border-border rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black tracking-[0.2em] uppercase">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  min={earliestAllowedBirthDate}
                  max={latestAllowedBirthDate}
                  defaultValue={patient.birthDate}
                  className="border-border rounded-xl font-mono"
                />
              </div>
            </div>
            <Button className="w-full rounded-xl font-black sm:w-auto">
              Save Changes
            </Button>
            {patient.role === 'primary' ? (
              <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-xl border p-4 pt-6">
                <div>
                  <h3 className="text-destructive text-sm font-black tracking-wider uppercase">
                    Danger zone
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Permanently delete this patient, all medications, and dose
                    history. This cannot be undone.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full rounded-xl font-bold sm:w-auto"
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

      <div className="bg-border relative h-px" />

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="section-label mb-2">Team</p>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              Caretakers
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              People who can log medications for this patient
            </p>
            {teamRoleError ? (
              <p className="text-destructive mt-2 text-sm font-medium">
                {teamRoleError}
              </p>
            ) : null}
          </div>
          {isPrimaryMember ? (
            <InviteCaretakerDialog
              patientId={typedPatientId}
              patientName={patient.name}
            />
          ) : null}
        </div>

        {teamData === undefined ? (
          <TeamSectionSkeleton />
        ) : members.length === 0 ? (
          <div className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-6">
            <p className="text-muted-foreground font-mono text-sm">
              No caretakers yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member._id}
                className="group border-border hover:border-primary/20 flex items-center gap-3 rounded-xl border p-3 transition-colors duration-150 sm:gap-4 sm:p-4"
              >
                <Avatar className="border-border group-hover:border-primary/30 h-9 w-9 shrink-0 border transition-colors sm:h-10 sm:w-10">
                  <AvatarFallback className="text-xs font-bold sm:text-sm">
                    {getMemberInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold sm:text-base">
                    {getMemberLabel(member)}
                  </p>
                  <p className="text-muted-foreground truncate font-mono text-xs sm:text-sm">
                    {member.user.email}
                  </p>
                </div>
                {isPrimaryMember &&
                viewerUserId &&
                member.userId !== viewerUserId ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={member.role}
                      disabled={pendingRoleMemberId === member._id}
                      onValueChange={(nextRole) => {
                        if (
                          !nextRole ||
                          !isMemberRole(nextRole) ||
                          nextRole === member.role
                        ) {
                          return
                        }

                        void updateMemberRole.mutateAsync({
                          patientId: typedPatientId,
                          memberId: member._id,
                          role: nextRole,
                        })
                      }}
                    >
                      <SelectTrigger className="border-border h-8 min-w-[132px] rounded-md text-xs font-semibold tracking-wide uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border rounded-xl border">
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="caretaker">Caretaker</SelectItem>
                      </SelectContent>
                    </Select>
                    {pendingRoleMemberId === member._id ? (
                      <Badge
                        variant="secondary"
                        className="rounded-md text-[10px] tracking-wider uppercase"
                      >
                        Saving…
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-md text-[10px] font-semibold tracking-wider uppercase sm:text-xs"
                  >
                    {formatMemberRole(member.role)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {isPrimaryMember && pendingInvites.length > 0 ? (
          <div className="space-y-3 pt-3">
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase">
                Pending Invites
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Access will activate when the invited person accepts.
              </p>
            </div>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.inviteId}
                  className="border-border bg-muted/20 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-bold">{invite.email}</p>
                      <p className="text-muted-foreground text-xs">
                        Invited {formatInviteDate(invite.invitedAt)}
                        {invite.invitedByName
                          ? ` by ${invite.invitedByName}`
                          : ''}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Expires {formatInviteDate(invite.expiresAt)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-md text-[10px] tracking-wider uppercase sm:text-xs"
                    >
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className="bg-border relative h-px" />

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="section-label mb-2">Prescriptions</p>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              Medications
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Active prescriptions and their schedules
            </p>
          </div>
          <AddMedicationDialog />
        </div>

        <div className="space-y-2">
          {activeMedications === undefined ? (
            <SettingsSectionSkeleton />
          ) : activeMedications.length === 0 ? (
            <div className="border-border bg-muted/20 rounded-2xl border p-4 sm:p-6">
              <p className="text-muted-foreground font-mono text-sm">
                No medications yet. Add the first one above.
              </p>
            </div>
          ) : (
            activeMedications.map((medication) => (
              <Card
                key={medication._id}
                className={cn(
                  'haven-card border-border hover:border-primary/20 rounded-xl transition-colors',
                  medication.optimistic ? 'opacity-80' : '',
                )}
              >
                <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <div className="bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10">
                    <Pill className="text-primary-foreground h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold sm:text-base">
                        {medication.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-md font-mono text-xs"
                      >
                        {medication.dosage}
                      </Badge>
                      {medication.optimistic ? (
                        <Badge
                          variant="secondary"
                          className="rounded-md text-[10px] tracking-wider uppercase sm:text-xs"
                        >
                          Saving
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs sm:text-sm">
                      {medication.scheduledTimes
                        .map((hour) => formatScheduledHour(hour))
                        .join(' · ')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
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
            <div className="space-y-2 pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-black tracking-tight sm:text-base">
                  Archived
                </h3>
                <p className="text-muted-foreground text-xs">
                  Shown for reference
                </p>
              </div>

              {archivedMedications.map((medication) => (
                <Card
                  key={medication._id}
                  className={cn(
                    'haven-card border-border bg-muted/25 rounded-xl opacity-70',
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    <div className="border-border bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10">
                      <Pill className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-sm font-bold sm:text-base">
                          {medication.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-xs"
                        >
                          {medication.dosage}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-md text-[10px] tracking-wider uppercase sm:text-xs"
                        >
                          Archived
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 font-mono text-xs sm:text-sm">
                        {medication.scheduledTimes
                          .map((hour) => formatScheduledHour(hour))
                          .join(' · ')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
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
