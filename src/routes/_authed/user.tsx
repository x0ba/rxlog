import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { waitForAuthedAppReady } from '~/lib/auth-ready'
import { profileQuery } from '~/lib/convex-queries'

export const Route = createFileRoute('/_authed/user')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await waitForAuthedAppReady({
      queryClient: context.queryClient,
    })
    await context.queryClient.ensureQueryData(profileQuery())
  },
})

function RouteComponent() {
  const { data: profile } = useQuery(profileQuery())

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-2">Account</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Profile
        </h1>
      </div>
      <div className="border-3 border-foreground/80 p-5 sm:p-6 brutalist-shadow-sm">
        {profile == null ? (
          <p className="text-muted-foreground font-mono">
            You are not logged in.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Email
              </p>
              <p className="font-mono text-sm sm:text-base">{profile.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
