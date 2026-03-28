import { useEffect } from 'react'
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/tanstack-react-start'
import { getCurrentRelativeUrl, sanitizeRedirectUrl } from '~/lib/auth-redirect'

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
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoaded || isSignedIn) return

    const redirectUrl =
      sanitizeRedirectUrl(getCurrentRelativeUrl()) ?? '/dashboard'

    void navigate({
      to: '/sign-in/$',
      params: { _splat: '' },
      search: { redirect_url: redirectUrl },
      replace: true,
    })
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded) {
    return <AuthShell />
  }

  if (!isSignedIn) {
    return <AuthShell />
  }

  return <Outlet />
}
