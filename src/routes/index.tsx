import { useEffect } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useAuth,
} from '@clerk/tanstack-react-start'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Pill,
  Shield,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

const FEATURES = [
  {
    num: '01',
    title: 'Never miss a dose',
    desc: 'Real-time tracking and smart reminders keep every medication on schedule.',
    icon: Clock,
  },
  {
    num: '02',
    title: 'Care team sync',
    desc: 'Invite family, caregivers, and providers to coordinate together.',
    icon: Users,
  },
  {
    num: '03',
    title: 'Instant alerts',
    desc: 'Get notified the moment a dose is late or missed. No surprises.',
    icon: Bell,
  },
  {
    num: '04',
    title: 'Dead simple',
    desc: 'No training needed. Add a patient, add meds, done.',
    icon: Zap,
  },
]

const STATS = [
  { value: '99.2%', label: 'Uptime' },
  { value: '<1s', label: 'Sync speed' },
  { value: '0', label: 'Data sold' },
]

function Home() {
  const { isLoaded } = useAuth()

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  if (!isLoaded) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <DevMessage />
      <StatsStrip />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  )
}

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-foreground/10 backdrop-blur-md bg-background/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex items-center justify-center h-8 w-8 bg-primary group-hover:bg-primary/90 transition-colors">
            <Pill
              className="h-4.5 w-4.5 text-primary-foreground group-hover:rotate-[-12deg] transition-transform duration-200"
              strokeWidth={2.5}
            />
          </span>
          <span className="text-lg font-black tracking-tight">RxLog</span>
        </Link>
        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden sm:block text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden sm:block text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="#why-i-built-this"
            className="hidden sm:block text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Why I built this
          </a>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="border-2 border-foreground/80 rounded-none font-black text-sm uppercase tracking-wider brutalist-shadow-sm"
              >
                Log in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button className="rounded-none font-black text-sm uppercase tracking-wider brutalist-shadow-sm">
                Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-[0.07]"
          style={{
            background:
              'radial-gradient(circle, oklch(0.40 0.1 170) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-1/3 -left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background:
              'radial-gradient(circle, oklch(0.60 0.16 35) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div
          className="inline-block mb-6 sm:mb-8 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 border-2 border-accent/60 bg-accent/10 text-accent text-xs font-black uppercase tracking-[0.2em]">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            Medication tracking, simplified
          </span>
        </div>

        <h1
          className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.85] tracking-tighter animate-card-enter"
          style={{ animationDelay: '200ms' }}
        >
          Every dose.
          <br />
          <span className="text-primary">Accounted for.</span>
        </h1>

        <p
          className="mt-8 sm:mt-10 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed animate-card-enter"
          style={{ animationDelay: '350ms' }}
        >
          RxLog keeps patients, caregivers, and care teams on the same page.
          Track medications in real time. No complexity. No missed doses.
        </p>

        <div
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-4 animate-card-enter"
          style={{ animationDelay: '500ms' }}
        >
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="rounded-none font-black text-base uppercase tracking-wider brutalist-shadow px-8 py-6 gap-3"
            >
              Start tracking
              <ArrowRight className="h-5 w-5" />
            </Button>
          </SignInButton>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="rounded-none border-2 border-foreground/80 font-black text-base uppercase tracking-wider px-8 py-6"
            >
              Learn more
            </Button>
          </a>
        </div>

        <div
          className="mt-16 sm:mt-24 relative animate-card-enter"
          style={{ animationDelay: '650ms' }}
        >
          <div className="border-2 border-foreground/80 brutalist-shadow bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                rxlog — dashboard
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Margaret S.', 'James K.', 'Elaine P.'].map((name, i) => (
                <div
                  key={name}
                  className="border-2 border-foreground/60 p-4 accent-stripe"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-accent flex items-center justify-center text-accent-foreground text-xs font-black">
                      {name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span className="font-black text-sm truncate">{name}</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { status: 'taken', label: 'Lisinopril' },
                      { status: 'taken', label: 'Metformin' },
                      {
                        status: i === 2 ? 'missed' : 'taken',
                        label: 'Atorvastatin',
                      },
                    ].map((med) => (
                      <div
                        key={med.label}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${med.status === 'taken' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        <span className="font-mono">{med.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 sm:py-32 px-6 bg-primary text-primary-foreground border-y-2 border-foreground/90"
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-3">
          Features
        </p>
        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-16 sm:mb-20">
          Less friction.
          <br />
          More care.
        </h2>

        <div className="grid sm:grid-cols-2 gap-0 border-2 border-primary-foreground/30">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.num}
                className={`p-8 sm:p-10 ${i < 2 ? 'border-b-2 border-primary-foreground/30' : ''} ${i % 2 === 0 ? 'sm:border-r-2 sm:border-primary-foreground/30' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-accent tracking-wider">
                    /{f.num}
                  </span>
                  <Icon className="h-5 w-5 text-accent" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-3 uppercase">
                  {f.title}
                </h3>
                <p className="text-primary-foreground/70 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StatsStrip() {
  return (
    <section className="py-12 px-6 border-b-2 border-foreground/80">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        {STATS.map((s, i) => (
          <div key={s.label} className="text-center flex-1">
            <div className="text-5xl sm:text-6xl font-black tracking-tighter text-primary">
              {s.value}
            </div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
              {s.label}
            </div>
            {i < STATS.length - 1 && (
              <div className="hidden sm:block absolute right-0 top-1/4 bottom-1/4 w-px bg-foreground/20" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function DevMessage() {
  return (
    <section
      id="why-i-built-this"
      className="relative scroll-mt-24 border-b-2 border-foreground/80 bg-accent text-primary-foreground"
    >
      <div className="mx-auto flex min-h-[min(70vh,32rem)] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center sm:min-h-112 sm:py-28">
        <blockquote className="font-black uppercase tracking-tight text-[clamp(1.125rem,3.5vw,2.25rem)] leading-[1.15]">
          "I built RxLog because I was tired of medication logging software that
          was too complex to use. I wanted something that anyone could pick up
          and use, without compromising on security or privacy."
        </blockquote>
        <div className="mt-10 border border-primary-foreground/50 px-6 py-2.5 text-xs font-black uppercase tracking-[0.28em]">
          — DANIEL
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Add your patients',
      desc: 'Create profiles for everyone you care for in seconds.',
    },
    {
      step: '02',
      title: 'Set up medications',
      desc: 'Add prescriptions with dosage, frequency, and schedule.',
    },
    {
      step: '03',
      title: 'Track & coordinate',
      desc: 'Log doses, see history, invite your care team to help.',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-3">
          How it works
        </p>
        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-16 sm:mb-20">
          Three steps.
          <br />
          That's it.
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="border-2 border-foreground/80 p-8 brutalist-shadow relative group"
            >
              <span className="text-7xl sm:text-8xl font-black text-foreground/[0.04] absolute top-2 right-4 leading-none select-none">
                {s.step}
              </span>
              <div className="relative">
                <div className="w-10 h-10 bg-primary flex items-center justify-center mb-6">
                  <CheckCircle2
                    className="h-5 w-5 text-primary-foreground"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="text-lg font-black tracking-tight uppercase mb-3">
                  {s.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-6 bg-accent text-accent-foreground border-y-2 border-foreground/90">
      <div className="max-w-3xl mx-auto text-center">
        <Shield className="h-12 w-12 mx-auto mb-6 opacity-80" strokeWidth={2} />
        <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">
          Your data stays yours.
        </h2>
        <p className="text-lg sm:text-xl opacity-80 mb-10 max-w-xl mx-auto leading-relaxed">
          No ads. No selling data. No third-party trackers. Built for people who
          take care seriously.
        </p>
        <SignInButton mode="modal">
          <Button
            size="lg"
            variant="outline"
            className="rounded-none border-2 border-foreground/90 bg-background font-black text-base uppercase tracking-wider px-10 py-6 gap-3 text-foreground hover:bg-foreground hover:text-background brutalist-shadow"
          >
            Get started free
            <ArrowRight className="h-5 w-5" />
          </Button>
        </SignInButton>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t-2 border-foreground/10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-6 w-6 bg-primary">
            <Pill
              className="h-3 w-3 text-primary-foreground"
              strokeWidth={2.5}
            />
          </span>
          <span className="text-sm font-black tracking-tight">RxLog</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          &copy; {new Date().getFullYear()} RxLog. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
