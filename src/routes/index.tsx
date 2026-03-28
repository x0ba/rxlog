import { useEffect } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  useAuth,
} from '@clerk/tanstack-react-start'
import { ArrowRight, Pill } from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

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
    <div className="min-h-screen flex flex-col bg-background landing-page">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ComparisonSection />
      <DevMessage />
      <CTASection />
      <Footer />
    </div>
  )
}

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/90 border-b border-foreground/10">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 group">
          <span className="text-xl font-black tracking-[-0.04em] lowercase">
            rxlog<span className="text-accent">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <a
            href="#features"
            className="hidden sm:block text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hidden sm:block text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="#compare"
            className="hidden md:block text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Compare
          </a>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="rounded-none border-2 border-foreground/80 font-black text-xs uppercase tracking-[0.15em] h-9 px-5 brutalist-shadow-sm"
              >
                Log in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button className="rounded-none font-black text-xs uppercase tracking-[0.15em] h-9 px-5 brutalist-shadow-sm border-2 border-foreground">
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
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[60%] h-full opacity-[0.035]"
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

      <div className="max-w-[1200px] mx-auto relative">
        <div
          className="animate-fade-in mb-8 sm:mb-12"
          style={{ animationDelay: '100ms' }}
        >
          <span className="inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-accent font-bold">
            <span className="w-8 h-px bg-accent" />
            Medication tracking, simplified
          </span>
        </div>

        <h1
          className="animate-card-enter font-black uppercase leading-[0.82] tracking-[-0.04em]"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 10rem)',
            animationDelay: '200ms',
          }}
        >
          Every
          <br />
          dose<span className="text-accent">.</span>
          <br />
          <span className="text-primary">Tracked</span>
          <span className="text-accent">.</span>
        </h1>

        <div
          className="mt-10 sm:mt-14 flex flex-col sm:flex-row gap-8 sm:gap-16 sm:items-end animate-card-enter"
          style={{ animationDelay: '400ms' }}
        >
          <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed font-medium">
            RxLog keeps patients, caregivers, and care teams on the same page.
            No complexity. No missed doses. No surprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="rounded-none font-black text-sm uppercase tracking-[0.12em] brutalist-shadow px-8 py-6 gap-3 border-2 border-foreground"
                >
                  Start tracking
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="rounded-none font-black text-sm uppercase tracking-[0.12em] brutalist-shadow px-8 py-6 gap-3 border-2 border-foreground"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="mt-16 sm:mt-24 grid grid-cols-3 border-2 border-foreground/80 animate-card-enter"
          style={{ animationDelay: '600ms' }}
        >
          {[
            { value: '99.2%', label: 'Uptime' },
            { value: '<1s', label: 'Sync speed' },
            { value: '0', label: 'Data sold' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`p-5 sm:p-8 text-center ${i < 2 ? 'border-r-2 border-foreground/80' : ''}`}
            >
              <div className="text-2xl sm:text-4xl font-black tracking-tighter text-primary">
                {s.value}
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div
          className="mt-8 sm:mt-12 animate-card-enter"
          style={{ animationDelay: '750ms' }}
        >
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="border-2 border-foreground/80 brutalist-shadow bg-card">
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground/80 bg-primary">
        <div className="flex items-center gap-2">
          <Pill className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
          <span className="text-xs font-black text-primary-foreground tracking-tight lowercase">
            rxlog<span className="text-accent">.</span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-primary-foreground/60 uppercase tracking-wider">
          Dashboard — Live
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Margaret S.',
              meds: [
                { name: 'Lisinopril', status: 'taken' },
                { name: 'Metformin', status: 'taken' },
                { name: 'Atorvastatin', status: 'taken' },
              ],
            },
            {
              name: 'James K.',
              meds: [
                { name: 'Lisinopril', status: 'taken' },
                { name: 'Metformin', status: 'taken' },
                { name: 'Atorvastatin', status: 'taken' },
              ],
            },
            {
              name: 'Elaine P.',
              meds: [
                { name: 'Lisinopril', status: 'taken' },
                { name: 'Metformin', status: 'taken' },
                { name: 'Atorvastatin', status: 'missed' },
              ],
            },
          ].map((patient) => (
            <div
              key={patient.name}
              className="border-2 border-foreground/60 card-shadow-accent"
            >
              <div className="flex items-center gap-3 p-4 border-b border-foreground/20">
                <div className="w-9 h-9 bg-accent flex items-center justify-center text-accent-foreground text-xs font-black shrink-0">
                  {patient.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <span className="font-black text-sm truncate">
                  {patient.name}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {patient.meds.map((med) => (
                  <div
                    key={med.name}
                    className="flex items-center gap-2.5 text-xs"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${med.status === 'taken' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    />
                    <span className="font-mono">{med.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    num: '01',
    title: 'Never miss a dose',
    desc: 'Real-time tracking and smart reminders keep every medication on schedule. Always.',
  },
  {
    num: '02',
    title: 'Care team sync',
    desc: 'Invite family, caregivers, and providers. Everyone coordinates in one place.',
  },
  {
    num: '03',
    title: 'Instant alerts',
    desc: 'Get notified the moment a dose is late or missed. Zero surprises.',
  },
  {
    num: '04',
    title: 'Dead simple',
    desc: 'No training needed. Add a patient, add meds, done. That\'s the whole thing.',
  },
]

function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 sm:py-28 px-6 border-t-2 border-foreground/80"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16 sm:mb-20">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent font-bold">
              Why RxLog
            </span>
            <h2 className="text-4xl sm:text-[4.5rem] font-black tracking-[-0.04em] leading-[0.85] mt-3 uppercase">
              Less friction.
              <br />
              More care.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed font-medium">
            Built for people who don't want to fight their tools. Everything you
            need, nothing you don't.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-foreground/80">
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              className={`p-7 sm:p-8 group relative ${
                i < FEATURES.length - 1
                  ? 'border-b-2 sm:border-b-0 sm:border-r-2 border-foreground/80'
                  : ''
              } ${i < 2 ? 'lg:border-b-0' : ''} ${i === 1 ? 'sm:border-r-0 lg:border-r-2' : ''} ${i === 2 ? 'sm:border-r-2 lg:border-r-2' : ''}`}
              style={{
                borderRightWidth:
                  i < FEATURES.length - 1 ? undefined : undefined,
              }}
            >
              <span className="font-mono text-xs text-accent tracking-wider font-bold block mb-5">
                /{f.num}
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight uppercase mb-3">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      num: '1',
      title: 'Add patients',
      desc: 'Create profiles for everyone you care for. Takes seconds, not minutes.',
    },
    {
      num: '2',
      title: 'Set up meds',
      desc: 'Add prescriptions with dosage and frequency. We handle the scheduling.',
    },
    {
      num: '3',
      title: 'Track & coordinate',
      desc: 'Log doses, view history, invite your care team. All in real time.',
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 px-6 bg-primary text-primary-foreground border-y-2 border-foreground/90"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-4xl sm:text-[4.5rem] font-black tracking-[-0.04em] leading-[0.85] uppercase">
            How it works<span className="text-accent">.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className="border-2 border-primary-foreground/30 bg-primary relative overflow-hidden group"
            >
              <div className="flex items-baseline justify-between p-6 pb-0">
                <span className="text-[5rem] sm:text-[6rem] font-black leading-none text-primary-foreground/10 select-none">
                  {s.num}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent font-bold">
                  Step
                </span>
              </div>
              <div className="p-6 pt-4 border-t-2 border-primary-foreground/30 mt-4">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                  {s.title}
                </h3>
                <p className="text-primary-foreground/60 text-sm leading-relaxed">
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

function ComparisonSection() {
  return (
    <section id="compare" className="py-20 sm:py-28 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          <div className="lg:w-1/3 lg:sticky lg:top-28">
            <h2 className="text-4xl sm:text-[4rem] font-black tracking-[-0.04em] leading-[0.85] uppercase">
              The
              <br />
              rival<span className="text-accent">.</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed text-sm font-medium max-w-sm">
              Pen-and-paper logs, spreadsheets, and bloated enterprise apps all
              fail caregivers in different ways. RxLog was built to replace all
              of them.
            </p>
          </div>

          <div className="lg:w-2/3 grid sm:grid-cols-2 gap-5">
            <div className="border-2 border-foreground/80 p-7 sm:p-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold block mb-4">
                The old way
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
                Pen & Paper
              </div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-6">
                Or worse, memory
              </div>
              <div className="space-y-3.5 text-sm">
                {[
                  'Easy to forget',
                  'No team coordination',
                  'Zero accountability',
                  'Lost notebooks',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-red-500 font-bold text-xs">✕</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-foreground/80 p-7 sm:p-8 bg-primary text-primary-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent font-bold block mb-4">
                The solution
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-[-0.03em] mb-1 lowercase">
                rxlog<span className="text-accent">.</span>
              </div>
              <div className="font-mono text-xs text-primary-foreground/50 uppercase tracking-wider mb-6">
                Free to start
              </div>
              <div className="space-y-3.5 text-sm">
                {[
                  'Real-time tracking',
                  'Team coordination built in',
                  'Full dose history',
                  'Works on any device',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-accent font-bold text-xs">✓</span>
                    <span className="text-primary-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DevMessage() {
  return (
    <section
      id="why-i-built-this"
      className="relative scroll-mt-24 border-y-2 border-foreground/80 bg-accent text-accent-foreground"
    >
      <div className="max-w-[1200px] mx-auto flex min-h-[min(60vh,28rem)] flex-col items-center justify-center px-6 py-20 text-center sm:py-24">
        <blockquote className="font-black uppercase tracking-[-0.02em] text-[clamp(1.1rem,3.5vw,2.25rem)] leading-[1.15] max-w-4xl">
          "I built RxLog because I was tired of medication logging software that
          was too complex to use. I wanted something that anyone could pick up
          and use, without compromising on security or privacy."
        </blockquote>
        <div className="mt-8 border border-accent-foreground/50 px-6 py-2.5 text-xs font-black uppercase tracking-[0.28em]">
          — Daniel
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-5xl sm:text-[6rem] font-black tracking-[-0.04em] leading-[0.82] uppercase"
        >
          Start
          <br />
          now<span className="text-accent">.</span>
        </h2>
        <p className="mt-6 text-muted-foreground text-base sm:text-lg font-medium">
          Free to use. Set up in under a minute.
        </p>
        <div className="mt-10">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="rounded-none font-black text-sm uppercase tracking-[0.12em] px-10 py-6 gap-3 brutalist-shadow border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create your team
                <ArrowRight className="h-4 w-4" />
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button
                size="lg"
                className="rounded-none font-black text-sm uppercase tracking-[0.12em] px-10 py-6 gap-3 brutalist-shadow border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10 px-6 border-t-2 border-foreground/80 bg-primary text-primary-foreground">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50 font-bold block mb-4">
              Product
            </span>
            <div className="space-y-2.5">
              <a
                href="#features"
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                How it works
              </a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer">
                    Start free trial
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50 font-bold block mb-4">
              Compare
            </span>
            <div className="space-y-2.5">
              <a
                href="#compare"
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                RxLog vs Pen & Paper
              </a>
              <a
                href="#compare"
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                RxLog vs Spreadsheets
              </a>
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50 font-bold block mb-4">
              About
            </span>
            <div className="space-y-2.5">
              <a
                href="#why-i-built-this"
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Why I built this
              </a>
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/50 font-bold block mb-4">
              Account
            </span>
            <div className="space-y-2.5">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-black tracking-[-0.04em] lowercase">
            rxlog<span className="text-accent">.</span>
          </span>
          <p className="text-xs text-primary-foreground/40 font-mono">
            Medication tracking for people who care.
          </p>
        </div>
      </div>
    </footer>
  )
}
