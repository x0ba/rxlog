import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
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
import {
  incomingInvitesQuery,
  patientsListDigestQuery,
  prefetchQueryOnClient,
} from '~/lib/convex-queries'
import { waitForAuthedAppReady } from '~/lib/auth-ready'

type PatientsDigest = typeof api.patients.listPatientsDigest._returnType
type PatientCard = PatientsDigest[number] & { optimistic?: boolean }
type IncomingInvites = NonNullable<
  typeof api.invites.listIncomingInvites._returnType
>

const inviteMetadataFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export const Route = createFileRoute('/_authed/dashboard/')({
  loader: async ({ context }) => {
    await waitForAuthedAppReady({
      convexClient: context.convexClient,
      queryClient: context.queryClient,
    })
    await Promise.all([
      prefetchQueryOnClient(
        context.queryClient.ensureQueryData.bind(context.queryClient),
        patientsListDigestQuery(),
      ),
      prefetchQueryOnClient(
        context.queryClient.ensureQueryData.bind(context.queryClient),
        incomingInvitesQuery(),
      ),
    ])
  },
  component: Dashboard,
})

/* ─── Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="border-border bg-card/50 rounded-2xl border p-5 shadow-sm"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="bg-muted/60 mb-4 h-14 w-14 animate-pulse rounded-xl" />
          <div className="bg-muted/60 mb-3 h-5 w-3/4 animate-pulse rounded-md" />
          <div className="bg-muted/40 mb-5 h-3 w-1/2 animate-pulse rounded-md" />
          <div className="border-border/80 border-t pt-3">
            <div className="bg-muted/30 h-3 w-24 animate-pulse rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Empty state ─── */

function EmptyState() {
  return (
    <div className="border-border bg-muted/20 animate-fade-in relative rounded-2xl border-2 border-dashed p-10 text-center sm:p-20">
      <p className="text-muted-foreground/35 text-3xl leading-tight font-semibold tracking-tight select-none sm:text-5xl">
        No Patients
        <br />
        Yet
      </p>
      <p className="text-muted-foreground mt-8 text-sm">
        Add your first patient with the button above.
      </p>
    </div>
  )
}

function formatInviteMetadataDate(value: number | string | undefined) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return inviteMetadataFormatter.format(date)
}

function IncomingInvitesSkeleton() {
  return (
    <section className="space-y-4">
      <div>
        <p className="section-label mb-2">Invites</p>
        <h2 className="text-2xl font-black tracking-tight">Pending Access</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="border-border bg-muted/30 h-44 animate-pulse rounded-2xl border"
          />
        ))}
      </div>
    </section>
  )
}

/* ─── Patient card (grid variant) ─── */

function PatientGridCard({
  patient,
  index,
}: {
  patient: PatientCard
  index: number
}) {
  const age =
    new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
  const initials = patient.name
    .split(' ')
    .map((name) => name[0])
    .join('')

  const content = (
    <div className="haven-card group/card relative h-full overflow-hidden">
      <div className="bg-primary/35 group-hover/card:bg-accent/70 absolute top-0 right-0 left-0 h-1 rounded-t-[inherit] transition-colors duration-300" />
      <div className="flex h-full flex-col p-4 pt-5 sm:p-5 sm:pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="bg-accent text-accent-foreground flex h-14 w-14 items-center justify-center rounded-xl text-lg font-semibold shadow-sm select-none">
            {initials}
          </div>
          <ArrowRight className="text-muted-foreground/40 group-hover/card:text-accent h-4 w-4 transition-all duration-200 group-hover/card:translate-x-1.5" />
        </div>

        <h2 className="group-hover/card:text-primary truncate text-base font-semibold tracking-tight transition-colors sm:text-lg">
          {patient.name}
        </h2>

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-muted/60 border-border/80 rounded-lg border px-2 py-0.5 tabular-nums">
            {age}y
          </span>
          <span className="bg-muted/60 border-border/80 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
            <Users className="h-3 w-3" />
            <span className="tabular-nums">{patient.memberCount}</span>
          </span>
          {patient.optimistic && (
            <span className="text-accent animate-[pulse-subtle_2s_ease-in-out_infinite] font-medium">
              Saving…
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="border-border/70 text-muted-foreground group-hover/card:text-foreground/75 flex items-center justify-between border-t pt-3 text-xs transition-colors">
            <span className="text-primary/80 text-[10px] font-semibold tracking-wider uppercase">
              Open patient
            </span>
            <span className="font-medium transition-transform group-hover/card:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const cardClassName =
    'block animate-card-enter focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50 focus-visible:rounded-2xl' +
    (patient.optimistic ? ' pointer-events-none opacity-70' : '')

  if (patient.optimistic) {
    return (
      <div
        className={cardClassName}
        style={{ animationDelay: `${index * 80 + 100}ms` }}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to="/dashboard/patients/$patientId"
      params={{ patientId: patient._id }}
      preload="intent"
      className={cardClassName}
      style={{ animationDelay: `${index * 80 + 100}ms` }}
    >
      {content}
    </Link>
  )
}

/* ─── Add patient dialog ─── */

function AddPatientDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addPatientMutationFn = useConvexMutation(api.patients.addPatient)
  const addPatient = useMutation({
    mutationFn: addPatientMutationFn,
    onMutate: async (variables) => {
      const query = patientsListDigestQuery()
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousPatients =
        queryClient.getQueryData<PatientsDigest>(query.queryKey) ?? []
      const optimisticPatient: PatientCard = {
        _id: `optimistic-${crypto.randomUUID()}` as Id<'patients'>,
        name: variables.name,
        birthDate: variables.birthDate,
        timezone: variables.timezone ?? 'UTC',
        role: 'primary',
        memberCount: 1,
        optimistic: true,
      }

      queryClient.setQueryData<Array<PatientCard>>(
        query.queryKey,
        (current = []) => [optimisticPatient, ...current],
      )

      return { previousPatients, queryKey: query.queryKey }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousPatients)
    },
    onSettled: async (_data, _error, _variables, context) => {
      const queryKey = context?.queryKey ?? patientsListDigestQuery().queryKey
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      birthDate: '',
    },
    onSubmit: async ({ value, formApi }) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

      await addPatient.mutateAsync({
        name: value.name.trim(),
        birthDate: value.birthDate,
        timezone: timeZone,
      })
      formApi.reset()
      setOpen(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shrink-0 gap-2 rounded-full shadow-sm sm:w-auto" />
        }
      >
        <Plus className="h-4 w-4" />
        Add Patient
      </DialogTrigger>
      <DialogContent className="border-border rounded-2xl border shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            New Patient
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
                    className="text-foreground text-sm font-medium"
                  >
                    Full Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-patient-name"
                      type="text"
                      className="rounded-xl"
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
                    className="text-foreground text-sm font-medium"
                  >
                    Date of Birth
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="add-patient-dob"
                      type="date"
                      className="rounded-xl"
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
                disabled={isSubmitting || addPatient.isPending}
              >
                {isSubmitting || addPatient.isPending
                  ? 'Creating…'
                  : 'Create Patient'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Dashboard ─── */

function Dashboard() {
  const queryClient = useQueryClient()
  const { data: patients } = useQuery(patientsListDigestQuery())
  const { data: invites } = useQuery(incomingInvitesQuery())
  const [inviteActionError, setInviteActionError] = useState<string | null>(
    null,
  )
  const acceptInviteMutationFn = useConvexMutation(api.invites.acceptInvite)
  const rejectInviteMutationFn = useConvexMutation(api.invites.rejectInvite)

  const acceptInvite = useMutation({
    mutationFn: acceptInviteMutationFn,
    onMutate: async (variables) => {
      setInviteActionError(null)
      const query = incomingInvitesQuery()
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousInvites =
        queryClient.getQueryData<IncomingInvites>(query.queryKey) ?? []
      queryClient.setQueryData<IncomingInvites>(
        query.queryKey,
        (current = []) =>
          current.filter((invite) => invite.inviteId !== variables.inviteId),
      )

      return { previousInvites, queryKey: query.queryKey }
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousInvites)
      }
      setInviteActionError(error.message)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: context?.queryKey ?? incomingInvitesQuery().queryKey,
      })
      await queryClient.invalidateQueries({
        queryKey: patientsListDigestQuery().queryKey,
      })
    },
  })

  const rejectInvite = useMutation({
    mutationFn: rejectInviteMutationFn,
    onMutate: async (variables) => {
      setInviteActionError(null)
      const query = incomingInvitesQuery()
      await queryClient.cancelQueries({ queryKey: query.queryKey })

      const previousInvites =
        queryClient.getQueryData<IncomingInvites>(query.queryKey) ?? []
      queryClient.setQueryData<IncomingInvites>(
        query.queryKey,
        (current = []) =>
          current.filter((invite) => invite.inviteId !== variables.inviteId),
      )

      return { previousInvites, queryKey: query.queryKey }
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousInvites)
      }
      setInviteActionError(error.message)
    },
    onSettled: async (_data, _error, _variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: context?.queryKey ?? incomingInvitesQuery().queryKey,
      })
    },
  })
  const isInviteActionPending = acceptInvite.isPending || rejectInvite.isPending

  return (
    <div className="space-y-10">
      <div
        className="animate-fade-in flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
        style={{ animationDelay: '50ms' }}
      >
        <div>
          <p className="section-label mb-3">Dashboard</p>
          <h1 className="text-foreground text-5xl leading-none font-semibold tracking-tight sm:text-7xl">
            Patients
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Select a patient to manage medications
          </p>
        </div>
        <AddPatientDialog />
      </div>

      <div className="from-primary/40 via-accent/30 h-px w-full max-w-xs rounded-full bg-linear-to-r to-transparent" />

      {invites === undefined ? <IncomingInvitesSkeleton /> : null}

      {invites !== undefined && invites.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label mb-2">Invites</p>
              <h2 className="text-2xl font-black tracking-tight">
                Pending Access
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Accept an invite to start logging medications for that patient.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit rounded-md font-semibold tracking-wider uppercase"
            >
              {invites.length} pending
            </Badge>
          </div>

          {inviteActionError ? (
            <div className="border-destructive/30 bg-destructive/5 rounded-xl border px-4 py-3">
              <p className="text-destructive text-sm font-medium">
                {inviteActionError}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {invites.map((invite) => {
              const patientBirthDate = formatInviteMetadataDate(
                invite.patientBirthDate,
              )
              const expirationDate = formatInviteMetadataDate(invite.expiresAt)
              const inviterLabel =
                invite.invitedByName ?? invite.invitedByEmail ?? 'Care team'

              return (
                <Card
                  key={invite.inviteId}
                  className="haven-card border-border rounded-2xl"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs font-black tracking-[0.2em] uppercase">
                          Patient Invite
                        </p>
                        <h3 className="mt-2 truncate text-xl font-black tracking-tight">
                          {invite.patientName ?? 'Unnamed patient'}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Invited by {inviterLabel}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-md text-[10px] tracking-wider uppercase sm:text-xs"
                      >
                        Pending
                      </Badge>
                    </div>

                    <div className="text-muted-foreground space-y-1 text-sm">
                      {patientBirthDate ? <p>DOB {patientBirthDate}</p> : null}
                      {expirationDate ? <p>Expires {expirationDate}</p> : null}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        disabled={isInviteActionPending}
                        onClick={() => {
                          void rejectInvite.mutateAsync({
                            inviteId: invite.inviteId,
                          })
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        className="flex-1 rounded-xl font-bold"
                        disabled={isInviteActionPending}
                        onClick={() => {
                          void acceptInvite.mutateAsync({
                            inviteId: invite.inviteId,
                          })
                        }}
                      >
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}

      {patients === undefined ? (
        <DashboardSkeleton />
      ) : patients.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient, index) => (
            <PatientGridCard
              key={patient._id}
              patient={patient}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
