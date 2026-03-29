import { useEffect, useState } from 'react'
import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import { useAuth } from '@clerk/tanstack-react-start'
import { useConvexAuth } from 'convex/react'
import { AuthBootstrapError } from '~/components/auth-bootstrap-error'
import { getCurrentRelativeUrl, sanitizeRedirectUrl } from '~/lib/auth-redirect'
import { resetAuthedAppReady, waitForAuthedAppReady } from '~/lib/auth-ready'

export const Route = createFileRoute('/_authed')({
  component: AuthedLayout,
})

type BootstrapState = 'idle' | 'bootstrapping' | 'ready' | 'error'

function AuthShell() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-3 w-24 animate-pulse" />
        <div className="bg-muted h-10 w-56 animate-pulse" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-border bg-muted/40 h-24 animate-pulse border-2"
          />
        ))}
      </div>
    </div>
  )
}

function AuthedLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoading: isConvexAuthLoading } = useConvexAuth()
  const navigate = useNavigate()
  const { convexClient, queryClient } = useRouteContext({ from: '__root__' })
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('idle')
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!isLoaded || isSignedIn) return

    resetAuthedAppReady()
    setBootstrapState('idle')
    setBootstrapError(null)

    const redirectUrl =
      sanitizeRedirectUrl(getCurrentRelativeUrl()) ?? '/dashboard'

    void navigate({
      to: '/sign-in/$',
      params: { _splat: '' },
      search: { redirect_url: redirectUrl },
      replace: true,
    })
  }, [isLoaded, isSignedIn, navigate])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return
    }

    if (bootstrapState === 'ready') {
      return
    }

    if (isConvexAuthLoading) {
      setBootstrapState('idle')
      return
    }

    let cancelled = false
    setBootstrapState('bootstrapping')
    setBootstrapError(null)

    void waitForAuthedAppReady({
      convexClient,
      queryClient,
    })
      .then(() => {
        if (cancelled) return
        setBootstrapState('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setBootstrapState('error')
        setBootstrapError(
          error instanceof Error
            ? error.message
            : 'Auth session did not become ready in time.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [
    bootstrapState,
    convexClient,
    isConvexAuthLoading,
    isLoaded,
    isSignedIn,
    queryClient,
    retryKey,
  ])

  if (!isLoaded) {
    return <AuthShell />
  }

  if (!isSignedIn) {
    return <AuthShell />
  }

  if (
    isConvexAuthLoading ||
    bootstrapState === 'idle' ||
    bootstrapState === 'bootstrapping'
  ) {
    return <AuthShell />
  }

  if (bootstrapState === 'error') {
    return (
      <AuthBootstrapError
        message={bootstrapError ?? 'Auth session did not become ready in time.'}
        onRetry={() => {
          resetAuthedAppReady()
          setBootstrapState('idle')
          setBootstrapError(null)
          setRetryKey((current) => current + 1)
        }}
      />
    )
  }

  return <Outlet />
}
