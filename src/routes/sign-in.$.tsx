import { useEffect } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignIn, useAuth } from '@clerk/tanstack-react-start'
import { Pill } from 'lucide-react'
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-8">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                currentColor 20px,
                currentColor 21px
              )`,
            }}
          />
        </div>

        <div className="relative w-full max-w-[30rem]">
          <div className="mb-5 flex justify-center">
            <Link
              to="/"
              preload="intent"
              className="inline-flex items-center gap-2 text-xl font-black tracking-[-0.04em] lowercase transition-colors hover:text-accent"
            >
              <Pill className="h-4 w-4 text-accent" strokeWidth={2.5} />
              <span>
                rxlog<span className="text-accent">.</span>
              </span>
            </Link>
          </div>

          <div className="flex justify-center">
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-in"
                fallbackRedirectUrl={redirectUrl}
                forceRedirectUrl={redirectUrl}
                appearance={{
                  variables: {
                    borderRadius: '0px',
                    fontFamily: '"DM Sans Variable", sans-serif',
                    fontFamilyButtons: '"DM Sans Variable", sans-serif',
                    fontSize: '0.875rem',
                    spacingUnit: '1rem',
                    colorPrimary: 'oklch(0.72 0.17 35)',
                    colorText: 'oklch(0.16 0.01 50)',
                    colorTextSecondary: 'oklch(0.45 0.01 50)',
                    colorBackground: 'transparent',
                    colorInputBackground: 'oklch(0.98 0.005 50)',
                    colorInputText: 'oklch(0.16 0.01 50)',
                  },
                  elements: {
                    rootBox: 'w-full mx-auto',
                    cardBox: 'w-full shadow-none border-none',
                    card: 'shadow-none bg-transparent p-0 w-full gap-6 border-none',
                    headerTitle:
                      'font-black uppercase tracking-[-0.03em] text-lg',
                    headerSubtitle: 'font-mono text-[10px] uppercase tracking-[0.2em] font-bold',
                    socialButtonsBlockButton:
                      'border-2 border-foreground/60 rounded-none font-bold uppercase text-xs tracking-[0.1em] h-11 transition-all hover:border-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_oklch(0.16_0.01_50_/_0.6)]',
                    socialButtonsBlockButtonText: 'font-bold',
                    dividerLine: 'bg-foreground/20',
                    dividerText:
                      'font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground',
                    formFieldLabel:
                      'font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/70',
                    formFieldInput:
                      'border-2 border-foreground/40 rounded-none h-11 text-sm font-medium focus:border-foreground focus:ring-0 focus:shadow-[3px_3px_0_0_oklch(0.72_0.17_35_/_0.4)] transition-all',
                    formButtonPrimary:
                      'rounded-none border-2 border-foreground bg-foreground text-background font-black uppercase text-xs tracking-[0.15em] h-11 shadow-[4px_4px_0_0_oklch(0.72_0.17_35_/_0.75)] hover:shadow-[6px_6px_0_0_oklch(0.72_0.17_35_/_0.85)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0_0_oklch(0.72_0.17_35_/_0.75)] active:translate-x-[1px] active:translate-y-[1px] transition-all',
                    footerActionLink:
                      'font-bold text-accent hover:text-accent/80 underline-offset-4',
                    footerActionText: 'font-mono text-[10px] uppercase tracking-[0.15em]',
                    identityPreviewEditButton: 'text-accent hover:text-accent/80',
                    formFieldAction: 'font-mono text-[10px] uppercase tracking-[0.15em] text-accent font-bold',
                    otpCodeFieldInput:
                      'border-2 border-foreground/40 rounded-none font-mono text-lg font-black focus:border-foreground focus:shadow-[2px_2px_0_0_oklch(0.72_0.17_35_/_0.4)]',
                    alternativeMethodsBlockButton:
                      'border-2 border-foreground/40 rounded-none font-bold text-xs uppercase tracking-[0.1em] hover:border-foreground',
                    alert: 'border-2 rounded-none',
                    avatarBox: 'rounded-none',
                    badge: 'rounded-none font-mono text-[9px] uppercase tracking-wider',
                    footer: 'bg-transparent [&>div]:bg-transparent',
                  },
                }}
              />
          </div>
        </div>
      </div>
    </div>
  )
}

function SignInSkeleton() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-[36rem] w-full max-w-[30rem] animate-pulse border-2 border-border bg-muted/40" />
      </div>
    </div>
  )
}
