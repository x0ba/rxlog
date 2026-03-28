import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { ArrowRight, Plus, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
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
  patientsListDigestQuery,
  prefetchQueryOnClient,
} from '~/lib/convex-queries'

type PatientsDigest = typeof api.patients.listPatientsDigest._returnType
type PatientCard = PatientsDigest[number] & { optimistic?: boolean }

export const Route = createFileRoute('/_authed/dashboard')({
  loader: async ({ context }) => {
    await prefetchQueryOnClient(
      context.queryClient.ensureQueryData.bind(context.queryClient),
      patientsListDigestQuery(),
    )
  },
  component: Dashboard,
})

/* ─── Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="border-2 border-foreground/15 p-5"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="h-12 w-12 animate-pulse bg-muted/60 mb-4" />
          <div className="h-5 w-3/4 animate-pulse bg-muted/60 mb-3" />
          <div className="h-3 w-1/2 animate-pulse bg-muted/40 mb-5" />
          <div className="border-t border-dashed border-foreground/10 pt-3">
            <div className="h-3 w-24 animate-pulse bg-muted/30" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Empty state ─── */

function EmptyState() {
  return (
    <div className="border-2 border-dashed border-foreground/20 p-10 sm:p-16 text-center animate-fade-in">
      <p className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-foreground/8 select-none leading-tight">
        No Patients
        <br />
        Yet
      </p>
      <p className="text-sm text-muted-foreground mt-6 font-mono tracking-wide">
        Add your first patient with the button above.
      </p>
    </div>
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
    <div className="group/card border-2 border-foreground/80 bg-card relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 card-shadow-accent h-full">
      <div className="p-4 sm:p-5 flex flex-col h-full">
        {/* Initials block + arrow */}
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 border-2 border-foreground/80 bg-accent text-accent-foreground flex items-center justify-center font-black text-lg select-none">
            {initials}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover/card:text-accent group-hover/card:translate-x-1 transition-all duration-200" />
        </div>

        {/* Name */}
        <h2 className="text-base sm:text-lg font-black tracking-tight truncate group-hover/card:text-primary transition-colors">
          {patient.name}
        </h2>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono">
          <span className="tabular-nums">{age}y</span>
          <span className="text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="tabular-nums">{patient.memberCount}</span>
          </span>
          {patient.optimistic && (
            <>
              <span className="text-foreground/20">·</span>
              <span className="animate-[pulse-subtle_2s_ease-in-out_infinite] text-accent">
                Saving…
              </span>
            </>
          )}
        </div>

        {/* Footer action */}
        <div className="mt-auto pt-4">
          <div className="pt-3 border-t border-dashed border-foreground/15 flex items-center justify-between text-xs text-muted-foreground font-mono group-hover/card:text-foreground/70 transition-colors">
            <span>Open patient</span>
            <span className="group-hover/card:translate-x-0.5 transition-transform">
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const cardClassName =
    'block animate-card-enter focus-visible:outline-2 focus-visible:outline-accent' +
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
      to="/patients/$patientId"
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
          <Button className="gap-2 brutalist-shadow-accent w-full sm:w-auto shrink-0 font-mono uppercase tracking-wider text-xs" />
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
  const { data: patients } = useQuery(patientsListDigestQuery())

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in"
        style={{ animationDelay: '50ms' }}
      >
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-none">
              Patients
            </h1>
            {patients && patients.length > 0 && (
              <span className="inline-flex items-center justify-center h-8 sm:h-9 min-w-8 sm:min-w-9 px-2 border-2 border-foreground/80 bg-accent text-accent-foreground font-mono text-xs sm:text-sm font-black">
                {patients.length}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-3 text-xs sm:text-sm font-mono tracking-wide">
            Select a patient to manage medications
          </p>
        </div>
        <AddPatientDialog />
      </div>

      {/* Patient grid */}
      {patients === undefined ? (
        <DashboardSkeleton />
      ) : patients.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
