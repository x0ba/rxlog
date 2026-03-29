import { useEffect } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, useAuth } from '@clerk/tanstack-react-start'
import { ArrowRight, Heart, Shield, Users, Zap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { isLoaded } = useAuth()

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  if (!isLoaded) return null

  return (
    <>
      <style>{`
        .hv {
          --display: 'DM Sans Variable', system-ui, sans-serif;
          --body: 'DM Sans Variable', system-ui, sans-serif;
          --bg: #faf5ee;
          --fg: #2d2418;
          --sage: #7d9b76;
          --sage-light: #e8f0e5;
          --terra: #d4764e;
          --terra-light: #fce8dd;
          --blush: #f0d9cf;
          --cream: #fff8f2;
          --muted: #8a7e6d;
          --border: rgba(45,36,24,0.1);
          background: var(--bg);
          color: var(--fg);
          font-family: var(--body);
          -webkit-font-smoothing: antialiased;
        }
        .hv *::selection { background: rgba(125,155,118,0.3); }
        @keyframes hv-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hv-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes hv-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes hv-float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes hv-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .hv-rise { animation: hv-rise 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .hv-fade { animation: hv-fade 0.6s ease both; }
        .hv-display { font-family: var(--display); }
        .hv-card {
          background: var(--cream);
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 16px rgba(45,36,24,0.04), 0 0 0 0 transparent;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .hv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(45,36,24,0.08), 0 0 0 1px rgba(125,155,118,0.15);
        }
        .hv-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 36px;
          background: var(--sage);
          color: #fff;
          font-family: var(--display);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: -0.01em;
          text-decoration: none;
          border-radius: 100px;
          border: none; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 4px 16px rgba(125,155,118,0.25);
        }
        .hv-btn:hover { background: #6d8b66; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(125,155,118,0.35); }
        .hv-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 24px;
          background: transparent;
          color: var(--sage);
          font-family: var(--display);
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          border-radius: 100px;
          border: 1.5px solid var(--sage);
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .hv-btn-outline:hover { background: var(--sage-light); }
        .hv-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .hv-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <div className="hv flex min-h-screen flex-col">
        <HvNav />
        <HvHero />
        <HvTrust />
        <HvFeatures />
        <HvHowItWorks />
        <HvQuote />
        <HvCTA />
        <HvFooter />
      </div>
    </>
  )
}

function HvNav() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 py-4">
      <div
        className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3.5"
        style={{
          background: 'rgba(250,245,238,0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '100px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 20px rgba(45,36,24,0.06)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '10px',
              background: 'var(--sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="hv-display"
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--fg)',
              letterSpacing: '-0.02em',
            }}
          >
            rxlog
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {['Features', 'How it works', 'About'].map((item) => (
            <a
              key={item}
              href={`#hv-${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="hidden sm:block"
              style={{
                fontSize: '14px',
                color: 'var(--muted)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--muted)')
              }
            >
              {item}
            </a>
          ))}

          <SignedOut>
            <Link to="/sign-in/$" params={{ _splat: '' }} preload="intent">
              <span className="hv-btn-outline">Sign in</span>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <span className="hv-btn-outline">Dashboard</span>
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}

function HvHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 sm:pt-44 sm:pb-28">
      <div
        className="hv-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'var(--sage-light)',
          top: '-100px',
          right: '-150px',
          animation: 'hv-float-slow 8s ease-in-out infinite',
        }}
      />
      <div
        className="hv-blob"
        style={{
          width: '350px',
          height: '350px',
          background: 'var(--blush)',
          bottom: '50px',
          left: '-100px',
          animation: 'hv-float-slow 10s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
      <div
        className="hv-blob"
        style={{
          width: '200px',
          height: '200px',
          background: 'var(--terra-light)',
          top: '30%',
          left: '60%',
          animation: 'hv-float 6s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />

      <div className="relative mx-auto max-w-[1100px]">
        <div className="hv-fade" style={{ animationDelay: '100ms' }}>
          <span
            className="hv-display inline-flex items-center gap-3"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--sage)',
              letterSpacing: '0.02em',
              marginBottom: '24px',
              display: 'flex',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '3px',
                borderRadius: '2px',
                background: 'var(--sage)',
                display: 'inline-block',
              }}
            />
            Medication tracking, simplified
          </span>
        </div>

        <h1
          className="hv-display hv-rise"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            animationDelay: '200ms',
          }}
        >
          Care for the
          <br />
          people who
          <br />
          <span style={{ color: 'var(--sage)' }}>matter most</span>
          <span style={{ color: 'var(--terra)' }}>.</span>
        </h1>

        <div
          className="hv-rise mt-10 flex flex-col items-start gap-10 sm:mt-14 sm:flex-row sm:items-end sm:gap-20"
          style={{ animationDelay: '400ms' }}
        >
          <p
            className="max-w-md leading-relaxed"
            style={{
              fontSize: '17px',
              color: 'var(--muted)',
              lineHeight: 1.7,
            }}
          >
            RxLog helps patients, caregivers, and care teams stay on the same
            page. No complexity, no missed doses, no surprises — just simple,
            reliable medication tracking.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <SignedOut>
              <Link to="/sign-in/$" params={{ _splat: '' }} preload="intent">
                <span className="hv-btn">
                  Start tracking <ArrowRight size={16} />
                </span>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <span className="hv-btn">
                  Open dashboard <ArrowRight size={16} />
                </span>
              </Link>
            </SignedIn>
          </div>
        </div>

        <div
          className="hv-rise mt-16 sm:mt-24"
          style={{ animationDelay: '600ms' }}
        >
          <div
            style={{
              borderRadius: '24px',
              border: '1px solid var(--border)',
              background: 'var(--cream)',
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(45,36,24,0.06)',
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: 'var(--sage)',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Heart size={14} color="#fff" strokeWidth={2.5} />
                <span
                  className="hv-display"
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  rxlog
                </span>
              </div>
              <span
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}
              >
                Dashboard — Live
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    name: 'Margaret S.',
                    meds: [
                      { name: 'Lisinopril', ok: true },
                      { name: 'Metformin', ok: true },
                      { name: 'Atorvastatin', ok: true },
                    ],
                  },
                  {
                    name: 'James K.',
                    meds: [
                      { name: 'Lisinopril', ok: true },
                      { name: 'Metformin', ok: true },
                      { name: 'Atorvastatin', ok: true },
                    ],
                  },
                  {
                    name: 'Elaine P.',
                    meds: [
                      { name: 'Lisinopril', ok: true },
                      { name: 'Metformin', ok: true },
                      { name: 'Atorvastatin', ok: false },
                    ],
                  },
                ].map((patient) => (
                  <div
                    key={patient.name}
                    style={{
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      background: 'var(--bg)',
                    }}
                  >
                    <div
                      className="flex items-center gap-3 p-4"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '12px',
                          background: 'var(--terra)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {patient.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span
                        className="hv-display"
                        style={{ fontSize: '14px', fontWeight: 700 }}
                      >
                        {patient.name}
                      </span>
                    </div>
                    <div className="space-y-2.5 p-4">
                      {patient.meds.map((med) => (
                        <div
                          key={med.name}
                          className="flex items-center gap-3"
                          style={{ fontSize: '13px' }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: med.ok ? '#6db365' : '#e05252',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: 'var(--muted)' }}>
                            {med.name}
                          </span>
                        </div>
                      ))}
                    </div>
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

function HvTrust() {
  return (
    <div
      className="px-6"
      style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-3 divide-x divide-[var(--border)]">
        {[
          { value: '99.2%', label: 'Uptime' },
          { value: '<1s', label: 'Sync speed' },
          { value: '0', label: 'Data sold' },
        ].map((s) => (
          <div key={s.label} className="py-7 text-center sm:py-10">
            <div
              className="hv-display"
              style={{
                fontSize: 'clamp(20px, 4vw, 36px)',
                fontWeight: 900,
                color: 'var(--sage)',
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--muted)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const HV_FEATURES = [
  {
    icon: Zap,
    title: 'Never miss a dose',
    desc: 'Real-time tracking and smart reminders keep every medication on schedule.',
    color: 'var(--terra)',
    bg: 'var(--terra-light)',
  },
  {
    icon: Users,
    title: 'Care team sync',
    desc: 'Invite family, caregivers, and providers. Everyone stays coordinated.',
    color: 'var(--sage)',
    bg: 'var(--sage-light)',
  },
  {
    icon: Shield,
    title: 'Instant alerts',
    desc: 'Get notified the moment a dose is late or missed. Zero surprises.',
    color: 'var(--terra)',
    bg: 'var(--blush)',
  },
  {
    icon: Heart,
    title: 'Dead simple',
    desc: "No training needed. Add a patient, add meds, done. That's the whole thing.",
    color: 'var(--sage)',
    bg: 'var(--sage-light)',
  },
]

function HvFeatures() {
  return (
    <section
      id="hv-features"
      className="relative overflow-hidden px-6 py-24 sm:py-32"
    >
      <div
        className="hv-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'var(--sage-light)',
          top: '10%',
          right: '-200px',
          animation: 'hv-pulse 6s ease-in-out infinite',
        }}
      />

      <div className="relative mx-auto max-w-[1100px]">
        <div className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span
              className="hv-display flex items-center gap-3"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--sage)',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '3px',
                  borderRadius: '2px',
                  background: 'var(--sage)',
                  display: 'inline-block',
                }}
              />
              Why RxLog
            </span>
            <h2
              className="hv-display"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              Less friction.
              <br />
              <span style={{ color: 'var(--sage)' }}>More care.</span>
            </h2>
          </div>
          <p
            className="max-w-xs"
            style={{
              color: 'var(--muted)',
              fontSize: '15px',
              lineHeight: 1.7,
            }}
          >
            Built for people who don&apos;t want to fight their tools.
            Everything you need, nothing you don&apos;t.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {HV_FEATURES.map((f) => (
            <div key={f.title} className="hv-card" style={{ padding: '32px' }}>
              <div className="hv-icon-wrap mb-5" style={{ background: f.bg }}>
                <f.icon size={22} color={f.color} strokeWidth={2} />
              </div>
              <h3
                className="hv-display"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '10px',
                  letterSpacing: '-0.01em',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HvHowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Add patients',
      desc: 'Create profiles for everyone you care for. Takes seconds.',
      color: 'var(--sage)',
    },
    {
      num: '02',
      title: 'Set up meds',
      desc: 'Add prescriptions with dosage and frequency. We handle scheduling.',
      color: 'var(--terra)',
    },
    {
      num: '03',
      title: 'Track & coordinate',
      desc: 'Log doses, view history, invite your care team. All in real time.',
      color: 'var(--sage)',
    },
  ]

  return (
    <section
      id="hv-how-it-works"
      className="relative px-6 py-24 sm:py-32"
      style={{ background: 'var(--sage)', overflow: 'hidden' }}
    >
      <div
        className="hv-blob"
        style={{
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.08)',
          top: '-80px',
          left: '-100px',
        }}
      />
      <div
        className="hv-blob"
        style={{
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.05)',
          bottom: '-50px',
          right: '-50px',
        }}
      />

      <div className="relative mx-auto max-w-[1100px]">
        <div className="mb-16 text-center">
          <h2
            className="hv-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#fff',
            }}
          >
            How it works
            <span style={{ color: 'var(--terra)' }}>.</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.num}
              style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '36px',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                className="hv-display"
                style={{
                  fontSize: '48px',
                  fontWeight: 900,
                  color: s.color,
                  opacity: 0.2,
                  lineHeight: 1,
                  marginBottom: '20px',
                }}
              >
                {s.num}
              </div>
              <h3
                className="hv-display"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '10px',
                  color: 'var(--fg)',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HvQuote() {
  return (
    <section
      id="hv-about"
      className="relative overflow-hidden"
      style={{ background: 'var(--blush)' }}
    >
      <div
        className="hv-blob"
        style={{
          width: '400px',
          height: '400px',
          background: 'rgba(212,118,78,0.08)',
          top: '-100px',
          right: '-100px',
        }}
      />

      <div className="relative mx-auto max-w-[800px] px-6 py-28 text-center sm:py-36">
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--terra)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Heart size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <blockquote
          className="hv-display"
          style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
          }}
        >
          &ldquo;I built RxLog because I was tired of medication logging
          software that was too complex to use. I wanted something that anyone
          could pick up and use, without compromising on security or
          privacy.&rdquo;
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--sage)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            D
          </div>
          <div>
            <div
              className="hv-display"
              style={{ fontSize: '14px', fontWeight: 700 }}
            >
              Daniel
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Founder
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HvCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-36">
      <div
        className="hv-blob"
        style={{
          width: '500px',
          height: '500px',
          background: 'var(--sage-light)',
          top: '-200px',
          left: '-200px',
          animation: 'hv-float-slow 12s ease-in-out infinite',
        }}
      />
      <div
        className="hv-blob"
        style={{
          width: '300px',
          height: '300px',
          background: 'var(--blush)',
          bottom: '-100px',
          right: '-100px',
          animation: 'hv-float-slow 10s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2
          className="hv-display"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
          }}
        >
          Start caring,
          <br />
          <span style={{ color: 'var(--sage)' }}>together</span>
          <span style={{ color: 'var(--terra)' }}>.</span>
        </h2>
        <p
          className="mt-8"
          style={{
            color: 'var(--muted)',
            fontSize: '17px',
            lineHeight: 1.6,
          }}
        >
          Free to use. Set up in under a minute.
        </p>
        <div className="mt-12">
          <SignedOut>
            <Link to="/sign-in/$" params={{ _splat: '' }} preload="intent">
              <span className="hv-btn">
                Create your team <ArrowRight size={16} />
              </span>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <span className="hv-btn">
                Go to dashboard <ArrowRight size={16} />
              </span>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  )
}

function HvFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--cream)',
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 py-14">
        <div className="mb-12 grid grid-cols-2 gap-10 sm:grid-cols-4">
          {[
            {
              title: 'Product',
              links: [
                { label: 'Features', href: '#hv-features' },
                { label: 'How it works', href: '#hv-how-it-works' },
              ],
            },
            {
              title: 'Compare',
              links: [
                { label: 'vs Pen & Paper', href: '#hv-features' },
                { label: 'vs Spreadsheets', href: '#hv-features' },
              ],
            },
            {
              title: 'About',
              links: [{ label: 'Our story', href: '#hv-about' }],
            },
          ].map((group) => (
            <div key={group.title}>
              <span
                className="hv-display"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--sage)',
                  display: 'block',
                  marginBottom: '14px',
                }}
              >
                {group.title}
              </span>
              <div className="space-y-3">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: 'var(--muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'var(--fg)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--muted)')
                    }
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div>
            <span
              className="hv-display"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--sage)',
                display: 'block',
                marginBottom: '14px',
              }}
            >
              Account
            </span>
            <div className="space-y-3">
              <SignedOut>
                <Link
                  to="/sign-in/$"
                  params={{ _splat: '' }}
                  preload="intent"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    textDecoration: 'none',
                  }}
                >
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    textDecoration: 'none',
                  }}
                >
                  Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '8px',
                background: 'var(--sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={12} color="#fff" strokeWidth={2.5} />
            </div>
            <span
              className="hv-display"
              style={{ fontSize: '16px', fontWeight: 800 }}
            >
              rxlog
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Medication tracking for people who care.
          </p>
        </div>
      </div>
    </footer>
  )
}
