import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Heart } from 'lucide-react'

export const Route = createFileRoute('/compare/medisafe')({
  component: CompareMedisafePage,
  head: () => ({
    meta: [{ title: 'RxLog vs Medisafe — Honest Comparison' }],
  }),
})

function CompareMedisafePage() {
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
      `}</style>

      <div className="hv flex min-h-screen flex-col overflow-x-hidden">
        <CmpNav />
        <CmpHero />
        <CmpFeatureFight />
        <CmpHonestAdvice />
        <CmpCTA />
        <CmpFooter />
      </div>
    </>
  )
}

function CmpNav() {
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
          {[
            { label: 'Features', href: '/#hv-features' },
            { label: 'How it works', href: '/#hv-how-it-works' },
            { label: 'About', href: '/#hv-about' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
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
              {item.label}
            </a>
          ))}

          <Link to="/dashboard">
            <span className="hv-btn-outline">Dashboard</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function CmpHero() {
  return (
    <section className="relative px-6 pt-32 pb-20 sm:pt-44 sm:pb-28">
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
            Honest comparison
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
          RxLog vs
          <br />
          <span style={{ color: 'var(--sage)' }}>Medisafe</span>
          <span style={{ color: 'var(--terra)' }}>.</span>
        </h1>

        <div
          className="hv-rise mt-8 sm:mt-10"
          style={{ animationDelay: '350ms' }}
        >
          <p
            className="hv-display max-w-xl"
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: 800,
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
            }}
          >
            We&apos;re not better.
            <br />
            We&apos;re free and private.
            <br />
            <span style={{ color: 'var(--sage)' }}>That might be better.</span>
          </p>
        </div>

        <p
          className="hv-rise mt-8 max-w-lg leading-relaxed"
          style={{
            fontSize: '17px',
            color: 'var(--muted)',
            lineHeight: 1.7,
            animationDelay: '450ms',
          }}
        >
          Medisafe is a solid app built for individuals who want pill reminders.
          rxlog is a scrappy free tool that does medication tracking for whole
          care teams. No per-seat pricing. No ads. No data sold to pharma
          companies.
        </p>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    name: 'Price',
    desc: 'Math is hard, but not that hard.',
    medisafe: '$5/user/month',
    rxlog: 'Free. Forever.',
  },
  {
    name: 'Ads',
    desc: "Your health data isn't an ad product.",
    medisafe: 'Free tier shows ads',
    rxlog: 'No ads, ever',
  },
  {
    name: 'Data Privacy',
    desc: 'Read the fine print.',
    medisafe: 'Shared with pharma partners',
    rxlog: 'Zero data sold',
  },
  {
    name: 'Team Size',
    desc: 'Caregiving is a team sport.',
    medisafe: 'Single-user focused',
    rxlog: 'Unlimited care team',
  },
  {
    name: 'Speed',
    desc: "We obsess over this so you don't wait.",
    medisafe: "It's... fine",
    rxlog: 'Actually fast',
  },
  {
    name: 'Platform',
    desc: 'Use what you have.',
    medisafe: 'Mobile app only',
    rxlog: 'Web, any device',
  },
  {
    name: 'Sharing',
    desc: "Your care team doesn't want another account.",
    medisafe: 'Account required',
    rxlog: 'Invite link, no signup',
  },
]

function CmpFeatureFight() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
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
              Side by side
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
              Feature
              <br />
              <span style={{ color: 'var(--sage)' }}>fight.</span>
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
            No spin, just facts. Here&apos;s how we stack up against Medisafe on
            the things that actually matter.
          </p>
        </div>

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
            className="grid"
            style={{
              gridTemplateColumns: '2fr 1.2fr 1.2fr',
              background: 'var(--sage)',
            }}
          >
            {['Feature', 'Medisafe', 'rxlog'].map((col, i) => (
              <div
                key={col}
                className="hv-display"
                style={{
                  padding: '16px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: i === 2 ? '#fff' : 'rgba(255,255,255,0.7)',
                  borderLeft:
                    i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {FEATURES.map((f, idx) => (
            <div
              key={f.name}
              className="grid"
              style={{
                gridTemplateColumns: '2fr 1.2fr 1.2fr',
                borderTop:
                  idx > 0
                    ? '1px solid var(--border)'
                    : '1px solid var(--border)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(125,155,118,0.04)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <div style={{ padding: '20px 24px' }}>
                <span
                  className="hv-display"
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    display: 'block',
                  }}
                >
                  {f.name}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--muted)',
                    fontStyle: 'italic',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {f.desc}
                </span>
              </div>
              <div
                style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                {f.medisafe}
              </div>
              <div
                className="hv-display"
                style={{
                  padding: '20px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--sage)',
                  display: 'flex',
                  alignItems: 'center',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                {f.rxlog}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CmpHonestAdvice() {
  const medisafeReasons = [
    'You only need personal pill reminders for yourself',
    'You want a native iOS/Android app with home screen widgets',
    "You don't mind ads or data sharing for a free tier",
    'You prefer a mature app with years of app store reviews',
  ]

  const rxlogReasons = [
    "You're a caregiver managing meds for multiple people",
    'You want your whole care team coordinated in real-time',
    'You value privacy and refuse to have your health data sold',
    "You're tired of per-seat pricing for something this simple",
    'You prefer a web-based tool that works on any device',
  ]

  return (
    <section
      className="relative overflow-hidden px-6 py-24 sm:py-32"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <div className="relative mx-auto max-w-[1100px]">
        <div className="mb-16 text-center">
          <span
            className="hv-display mb-3 flex items-center justify-center gap-3"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--sage)',
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
            No hard feelings
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
            Honest
            <br />
            <span style={{ color: 'var(--sage)' }}>advice.</span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-md"
            style={{
              fontSize: '15px',
              color: 'var(--muted)',
              lineHeight: 1.7,
            }}
          >
            We could trash-talk Medisafe but that would be dishonest and also
            they have way more downloads than us. Here&apos;s the real deal.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="hv-card" style={{ padding: '36px' }}>
            <h3
              className="hv-display"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                marginBottom: '28px',
              }}
            >
              Use Medisafe if...
            </h3>
            <div className="space-y-5">
              {medisafeReasons.map((reason) => (
                <div
                  key={reason}
                  className="flex items-start gap-3"
                  style={{ fontSize: '14px', lineHeight: 1.6 }}
                >
                  <span
                    style={{
                      color: 'var(--muted)',
                      fontWeight: 600,
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    &mdash;
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: '20px',
              padding: '36px',
              background: 'var(--fg)',
              color: '#fff',
              border: '1px solid var(--fg)',
              boxShadow: '0 8px 40px rgba(45,36,24,0.15)',
            }}
          >
            <h3
              className="hv-display"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--sage)',
                marginBottom: '28px',
              }}
            >
              Use rxlog if...
            </h3>
            <div className="space-y-5">
              {rxlogReasons.map((reason) => (
                <div
                  key={reason}
                  className="flex items-start gap-3"
                  style={{ fontSize: '14px', lineHeight: 1.6 }}
                >
                  <span
                    style={{
                      color: 'var(--sage)',
                      fontWeight: 600,
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    &mdash;
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CmpCTA() {
  return (
    <section className="relative px-6 py-28 sm:py-36">
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
          Start
          <br />
          <span style={{ color: 'var(--sage)' }}>now</span>
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
          Free forever. Unlimited care team. No ads. No data sold.
        </p>
        <div className="mt-12">
          <Link to="/dashboard">
            <span className="hv-btn">
              Try rxlog free <ArrowRight size={16} />
            </span>
          </Link>
        </div>
        <p
          className="mt-8"
          style={{
            fontSize: '13px',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          Or keep paying $5/user/month. We don&apos;t judge.
          <br />
          <span style={{ fontStyle: 'italic' }}>(We judge a little.)</span>
        </p>
      </div>
    </section>
  )
}

function CmpFooter() {
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
                { label: 'Features', href: '/#hv-features' },
                { label: 'How it works', href: '/#hv-how-it-works' },
              ],
            },
            {
              title: 'Compare',
              links: [{ label: 'vs Medisafe', href: '/compare/medisafe' }],
            },
            {
              title: 'About',
              links: [{ label: 'Our story', href: '/#hv-about' }],
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
