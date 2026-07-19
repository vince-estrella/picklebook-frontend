import {
  FaSearch,
  FaBolt,
  FaHistory,
  FaUsers
} from 'react-icons/fa'

import { MdOutlineEventAvailable } from 'react-icons/md'

import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Design tokens — grounded in the court itself: deep court navy, kitchen
// teal, chalk-line white, and the citron of a pickleball. Display type reads
// like stadium signage; stats read like a scoreboard.
// ---------------------------------------------------------------------------
const COLORS = {
  navy: '#0B2A38',        // court surface, dark sections
  navyDeep: '#071D27',    // footer / deepest ink
  teal: '#0F6B5C',        // secondary structural color
  citron: '#D7E22B',      // the ball — primary accent, used sparingly
  citronHover: '#C3CC1F',
  chalk: '#EEF1EA',       // line-white background for light sections
  chalkDim: '#DCE1D6',
  ink: '#101817',         // body text on light backgrounds
  inkMute: '#5B6864',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        @keyframes drift {
          0%, 100% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
        }
        @media (max-width: 820px) {
          .hb-hero { grid-template-columns: 1fr !important; padding: 56px 24px !important; }
          .hb-hero-art { display: none !important; }
          .hb-stats { flex-wrap: wrap; row-gap: 20px !important; }
          .hb-features { grid-template-columns: 1fr !important; }
        }
        .hb-btn:focus-visible, .hb-link:focus-visible {
          outline: 2px solid ${COLORS.citron};
          outline-offset: 3px;
        }
      `}</style>

      <Navbar />

      {/* ================= HERO ================= */}
      <div style={{ background: COLORS.navy, position: 'relative', overflow: 'hidden' }}>
        <CourtLines />
        <div
          className="hb-hero"
          style={{
            position: 'relative',
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '96px 32px 64px',
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: COLORS.citron,
                marginBottom: '20px',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COLORS.citron, display: 'inline-block' }} />
              Courts open now
            </div>

            <h1
              style={{
                fontFamily: "'Big Shoulders Display', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(44px, 6vw, 68px)',
                lineHeight: 0.95,
                letterSpacing: '-0.01em',
                color: COLORS.chalk,
                margin: '0 0 20px',
                textTransform: 'uppercase',
              }}
            >
              Book your court
              <br />
              <span style={{ color: COLORS.citron }}>in seconds.</span>
            </h1>

            <p style={{ fontSize: '16px', color: '#A9B7B2', lineHeight: '1.7', marginBottom: '32px', maxWidth: '420px' }}>
              Real-time court availability, instant booking, and effortless schedule
              management for pickleball players. No fluff — just play.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="hb-btn"
                onClick={() => navigate('/courts')}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.citronHover}
                onMouseLeave={e => e.currentTarget.style.background = COLORS.citron}
                style={{
                  background: COLORS.citron,
                  color: COLORS.navyDeep,
                  border: 'none',
                  borderRadius: '4px',
                  padding: '14px 26px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  transition: 'background 0.15s ease',
                }}
              >
                <FaSearch size={13} />
                Find Courts
              </button>
              <button
                className="hb-btn"
                onClick={() => navigate('/courts')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(238,241,234,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{
                  background: 'transparent',
                  color: COLORS.chalk,
                  border: '1px solid rgba(238,241,234,0.35)',
                  borderRadius: '4px',
                  padding: '14px 26px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Book Now
              </button>
              <button
                className="hb-btn"
                onClick={() => navigate('/queue')}
                onMouseEnter={e => e.currentTarget.style.color = COLORS.citron}
                onMouseLeave={e => e.currentTarget.style.color = '#A9B7B2'}
                style={{
                  background: 'transparent',
                  color: '#A9B7B2',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '14px 10px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  transition: 'color 0.15s ease',
                }}
              >
                <FaUsers size={13} />
                Join Queue
              </button>
            </div>

            {/* Scoreboard stats */}
            <div
              className="hb-stats"
              style={{
                display: 'flex',
                gap: '0',
                marginTop: '52px',
                borderTop: `1px solid rgba(238,241,234,0.18)`,
                paddingTop: '20px',
              }}
            >
              {[
                { value: '3+', label: 'ACTIVE COURTS' },
                { value: '100%', label: 'REAL-TIME' },
                { value: 'FREE', label: 'TO BROWSE' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    paddingRight: '28px',
                    marginRight: '28px',
                    borderRight: i < 2 ? '1px solid rgba(238,241,234,0.18)' : 'none',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '26px',
                      fontWeight: 600,
                      color: COLORS.chalk,
                      margin: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#7C8B85', margin: '4px 0 0' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: court photo, framed like a court card */}
          <div
            className="hb-hero-art"
            style={{
              borderRadius: '10px',
              overflow: 'hidden',
              height: '380px',
              position: 'relative',
              border: `1px solid rgba(238,241,234,0.15)`,
            }}
          >
            <img
              src="https://res.cloudinary.com/graham-media-group/image/upload/f_auto/q_auto/c_scale,w_640/v1/media/gmg/K475EAGIMRDPVJAUVCTSLLA55A?_a=DAJHqpDbZAAA"
              alt="Pickleball court"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(11,42,56,0) 55%, rgba(11,42,56,0.55) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ maxWidth: '520px', marginBottom: '48px' }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: COLORS.teal,
                marginBottom: '12px',
              }}
            >
              The toolkit
            </p>
            <h2
              style={{
                fontFamily: "'Big Shoulders Display', sans-serif",
                fontWeight: 700,
                fontSize: '38px',
                lineHeight: 1,
                color: COLORS.ink,
                margin: '0 0 12px',
                textTransform: 'uppercase',
              }}
            >
              Stripped to the essentials
            </h2>
            <p style={{ color: COLORS.inkMute, fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
              Everything you need to manage your game, nothing you don't.
            </p>
          </div>

          <div className="hb-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: COLORS.chalkDim }}>
            {[
              {
                icon: <FaBolt size={18} color={COLORS.navy} />,
                title: 'Easy Booking',
                desc: "A streamlined checkout flow built for speed. Select your time, confirm, and you're ready to hit the court.",
              },
              {
                icon: <MdOutlineEventAvailable size={20} color={COLORS.navy} />,
                title: 'Real-Time Availability',
                desc: 'Live syncing with facility calendars. Never worry about double bookings or outdated schedules.',
              },
              {
                icon: <FaHistory size={18} color={COLORS.navy} />,
                title: 'Booking History',
                desc: 'Access your past sessions and upcoming games in one place.',
              },
            ].map(f => (
              <div
                key={f.title}
                style={{
                  background: COLORS.chalk,
                  padding: '32px 28px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: `1.5px solid ${COLORS.citron}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 8px', color: COLORS.ink }}>{f.title}</h3>
                <p style={{ color: COLORS.inkMute, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= CTA ================= */}
      <div style={{ background: COLORS.navy, padding: '72px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '1px',
            height: '100%',
            background: 'rgba(238,241,234,0.12)',
          }}
        />
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.citron,
            marginBottom: '14px',
          }}
        >
          Game on
        </p>
        <h2
          style={{
            fontFamily: "'Big Shoulders Display', sans-serif",
            fontWeight: 700,
            fontSize: '36px',
            color: COLORS.chalk,
            margin: '0 0 12px',
            textTransform: 'uppercase',
          }}
        >
          Ready to secure your court?
        </h2>
        <p style={{ color: '#A9B7B2', marginBottom: '32px', fontSize: '15px' }}>
          Join the pickleball community today. Simple, fast, and reliable.
        </p>
        <button
          className="hb-btn"
          onClick={() => navigate('/courts')}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.citronHover}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.citron}
          style={{
            background: COLORS.citron,
            color: COLORS.navyDeep,
            border: 'none',
            borderRadius: '4px',
            padding: '14px 28px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            transition: 'background 0.15s ease',
          }}
        >
          <FaSearch size={13} />
          Find Courts
        </button>
      </div>

      {/* ================= FOOTER ================= */}
      <div style={{ background: COLORS.navyDeep, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ color: COLORS.chalk, fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 700, fontSize: '18px', margin: 0, letterSpacing: '0.02em' }}>
            PICKLEBOOK
          </p>
          <p style={{ color: '#5B6864', fontSize: '12px', margin: '4px 0 0' }}>High-performance court management.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact Support'].map(link => (
            <span
              key={link}
              className="hb-link"
              tabIndex={0}
              role="button"
              onClick={() => {
                if (link === 'Privacy Policy') navigate('/privacy-policy')
                if (link === 'Terms of Service') navigate('/terms')
                if (link === 'Contact Support') navigate('/contact')
              }}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                if (link === 'Privacy Policy') navigate('/privacy-policy')
                if (link === 'Terms of Service') navigate('/terms')
                if (link === 'Contact Support') navigate('/contact')
              }}
              onMouseEnter={e => e.currentTarget.style.color = COLORS.chalk}
              onMouseLeave={e => e.currentTarget.style.color = '#5B6864'}
              style={{ color: '#5B6864', fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s ease' }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Subtle line-drawing of a pickleball court, used as ambient hero texture.
// Reads as a real court diagram (baselines, kitchen line, center line) at
// low opacity, with one drifting dot standing in for the ball.
function CourtLines() {
  return (
    <svg
      viewBox="0 0 1100 480"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14 }}
    >
      <rect x="60" y="40" width="980" height="400" fill="none" stroke="#EEF1EA" strokeWidth="2" />
      <line x1="60" y1="167" x2="1040" y2="167" stroke="#EEF1EA" strokeWidth="2" />
      <line x1="60" y1="313" x2="1040" y2="313" stroke="#EEF1EA" strokeWidth="2" />
      <line x1="550" y1="40" x2="550" y2="167" stroke="#EEF1EA" strokeWidth="2" />
      <line x1="550" y1="313" x2="550" y2="440" stroke="#EEF1EA" strokeWidth="2" />
      <circle cx="550" cy="240" r="4" fill="#D7E22B" opacity="0.8" style={{ animation: 'drift 6s ease-in-out infinite' }} />
    </svg>
  )
}

export default HomePage
