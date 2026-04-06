import { useEffect } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  useAuth,
} from '@clerk/tanstack-react-start'
import { Heart } from 'lucide-react'
import { sanitizeRedirectUrl } from '~/lib/auth-redirect'

type SignInSearch = {
  redirect_url?: string
}

export const Route = createFileRoute('/sign-in/$')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => {
    if (typeof search.redirect_url === 'string') {
      return { redirect_url: search.redirect_url }
    }

    return {}
  },
  component: SignInRoute,
})

function SignInRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const redirectUrl = sanitizeRedirectUrl(search.redirect_url) ?? '/dashboard'

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')

    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    void navigate({
      to: redirectUrl,
      replace: true,
    })
  }, [isLoaded, isSignedIn, navigate, redirectUrl])

  if (!isLoaded) {
    return <SignInSkeleton />
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="relative flex min-h-screen items-center justify-center px-6 py-8">
        <div className="relative w-full max-w-[30rem]">
          <div className="mb-5 flex justify-center">
            <Link
              to="/"
              preload="intent"
              className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.02em] lowercase transition-opacity hover:opacity-80"
            >
              <div
                className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-[10px]"
                aria-hidden
              >
                <Heart
                  className="text-primary-foreground size-3.5"
                  strokeWidth={2.5}
                />
              </div>
              <span>
                rxlog<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          <div className="flex justify-center">
            <ClerkLoading>
              <ClerkSignInFallback />
            </ClerkLoading>
            <ClerkLoaded>
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-in"
                fallbackRedirectUrl={redirectUrl}
                forceRedirectUrl={redirectUrl}
                appearance={{
                  variables: {
                    borderRadius: '12px',
                    fontFamily: '"DM Sans Variable", sans-serif',
                    fontFamilyButtons: '"DM Sans Variable", sans-serif',
                    fontSize: '0.875rem',
                    spacingUnit: '1rem',
                    colorPrimary: '#7d9b76',
                    colorText: '#2d2418',
                    colorTextSecondary: '#8a7e6d',
                    colorBackground: 'transparent',
                    colorInputBackground: '#fff8f2',
                    colorInputText: '#2d2418',
                  },
                  elements: {
                    rootBox: 'w-full mx-auto',
                    cardBox: 'w-full shadow-none border-none',
                    card: 'shadow-none bg-transparent p-0 w-full gap-6 border-none',
                    headerTitle:
                      'font-bold tracking-tight text-lg text-[#2d2418]',
                    headerSubtitle:
                      'font-mono text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8a7e6d]',
                    socialButtonsBlockButton:
                      'border border-[rgba(45,36,24,0.12)] rounded-xl font-semibold text-xs tracking-wide h-11 transition-colors hover:border-[rgba(45,36,24,0.2)] hover:bg-[#fff8f2]/80',
                    socialButtonsBlockButtonText: 'font-semibold',
                    dividerLine: 'bg-border',
                    dividerText:
                      'font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground',
                    formFieldLabel:
                      'font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-[#8a7e6d]',
                    formFieldInput:
                      'border border-[rgba(45,36,24,0.12)] rounded-xl h-11 text-sm font-medium bg-[#fff8f2] text-[#2d2418] focus:border-[#7d9b76] focus:ring-2 focus:ring-[#7d9b76]/20 focus:ring-offset-0 transition-colors',
                    formButtonPrimary:
                      'rounded-xl border-0 bg-[#7d9b76] text-white font-bold text-xs tracking-wide h-11 shadow-none hover:bg-[#6d8b66] active:scale-[0.99] transition-colors',
                    footerActionLink:
                      'font-semibold text-[#7d9b76] hover:text-[#6d8b66] underline-offset-4',
                    footerActionText:
                      'font-mono text-[10px] uppercase tracking-[0.15em]',
                    identityPreviewEditButton:
                      'text-[#7d9b76] hover:text-[#6d8b66]',
                    formFieldAction:
                      'font-mono text-[10px] uppercase tracking-[0.15em] text-[#7d9b76] font-semibold',
                    otpCodeFieldInput:
                      'border border-[rgba(45,36,24,0.12)] rounded-xl font-mono text-lg font-bold bg-[#fff8f2] focus:border-[#7d9b76] focus:ring-2 focus:ring-[#7d9b76]/20 focus:ring-offset-0',
                    alternativeMethodsBlockButton:
                      'border border-[rgba(45,36,24,0.12)] rounded-xl font-semibold text-xs tracking-wide hover:border-[rgba(45,36,24,0.2)] hover:bg-[#fff8f2]/80',
                    alert: 'border border-[rgba(45,36,24,0.12)] rounded-xl',
                    avatarBox: 'rounded-xl',
                    badge:
                      'rounded-lg font-mono text-[9px] uppercase tracking-wider',
                    footer: 'bg-transparent [&>div]:bg-transparent',
                  },
                }}
              />
            </ClerkLoaded>
            <ClerkFailed>
              <ClerkSignInError />
            </ClerkFailed>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignInSkeleton() {
  return (
    <div className="bg-background min-h-screen px-6 py-8">
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-border bg-muted/40 h-[36rem] w-full max-w-[30rem] animate-pulse rounded-2xl border" />
      </div>
    </div>
  )
}

function ClerkSignInFallback() {
  return (
    <div className="border-border bg-muted/40 w-full max-w-[30rem] animate-pulse rounded-2xl border p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-4 w-24 rounded-full" />
          <div className="bg-muted h-8 w-40 rounded-full" />
        </div>
        <div className="grid gap-3">
          <div className="bg-background h-11 rounded-xl" />
          <div className="bg-background h-11 rounded-xl" />
          <div className="bg-background h-11 rounded-xl" />
          <div className="bg-background h-11 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function ClerkSignInError() {
  return (
    <div className="border-border bg-muted/40 w-full max-w-[30rem] rounded-2xl border p-6 text-sm">
      <p className="text-foreground font-medium">Sign-in failed to load.</p>
      <p className="text-muted-foreground mt-2">
        Refresh the page. If this keeps happening in development, verify the
        Clerk publishable key is exposed as `VITE_CLERK_PUBLISHABLE_KEY`.
      </p>
    </div>
  )
}
