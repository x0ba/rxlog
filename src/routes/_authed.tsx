import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SignIn, useAuth } from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/_authed')({
  component: AuthedLayout,
})

function AuthShell() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse bg-muted" />
        <div className="h-10 w-56 animate-pulse bg-muted" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse border-2 border-border bg-muted/40"
          />
        ))}
      </div>
    </div>
  )
}

function AuthedLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <AuthShell />
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center p-12">
        <SignIn routing="hash" forceRedirectUrl="/dashboard" />
      </div>
    )
  }

  return <Outlet />
}
