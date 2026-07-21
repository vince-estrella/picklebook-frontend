import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Clock } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Same design tokens as HomePage — deep court navy, kitchen teal, chalk-line
// white, citron ball accent.
// ---------------------------------------------------------------------------
const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  citronHover: '#C3CC1F',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

// Status badges tinted to the court palette instead of stock red/green/amber.
const STATUS_STYLES = {
  Confirmed: { background: 'rgba(15,107,92,0.12)', color: COLORS.teal },
  Pending:   { background: 'rgba(215,226,43,0.18)', color: '#7A7F0E' },
  Cancelled: { background: 'rgba(180,53,53,0.10)', color: '#B43535' },
  Completed: { background: COLORS.chalkDim, color: COLORS.inkMute },
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toFixed(2)}`
}

function MyBookingsPage() {
  const navigate = useNavigate()
  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('playerToken')) {
      navigate('/login')
      return
    }
    api.get('/users/bookings')
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load your bookings. Please try logging in again.')
        setLoading(false)
      })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('playerToken')
    localStorage.removeItem('player')
    navigate('/login')
  }

  const now = new Date()
  const upcoming = bookings.filter(b => {
    const end = new Date(b.date)
    const [h] = (b.endTime || '00:00:00').split(':').map(Number)
    end.setHours(h)
    return end >= now && b.status !== 'Cancelled'
  })
  const past = bookings.filter(b => !upcoming.includes(b))

  const BookingCard = ({ b }) => (
    <div
      className="hb-card"
      style={{
        background: COLORS.chalk,
        border: `1px solid ${COLORS.chalkDim}`,
        borderRadius: '10px',
        padding: '22px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <h3
            style={{
              fontFamily: "'Big Shoulders Display', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              margin: 0,
              color: COLORS.ink,
            }}
          >
            {b.courtName}
          </h3>
          <span
            style={{
              ...(STATUS_STYLES[b.status] || { background: COLORS.chalkDim, color: COLORS.inkMute }),
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            {b.status}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: COLORS.inkMute, display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 6px' }}>
          <MapPin size={13} /> {b.courtAddress}
        </p>
        <div style={{ display: 'flex', gap: '18px', fontSize: '13px', color: COLORS.inkMute, marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} />
            {new Date(b.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} />
            {b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, borderLeft: `1px solid ${COLORS.chalkDim}`, paddingLeft: '20px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: COLORS.inkMute, margin: '0 0 4px', textTransform: 'uppercase' }}>
          Amount
        </p>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.teal,
            margin: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(b.amount)}
        </p>
        <p style={{ fontSize: '11px', color: '#9AA6A1', marginTop: '8px' }}>{b.bookingReference}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .hb-card:hover { border-color: ${COLORS.teal}; transform: translateY(-1px); }
        .hb-btn:focus-visible, .hb-link:focus-visible {
          outline: 2px solid ${COLORS.citron};
          outline-offset: 3px;
        }
        @media (max-width: 640px) {
          .hb-bookings-header { flex-direction: column; align-items: flex-start !important; gap: 20px !important; }
        }
      `}</style>

      <Navbar />

      {/* ================= HEADER (navy band, matches hero) ================= */}
      <div style={{ background: COLORS.navy, position: 'relative', overflow: 'hidden' }}>
        <div
          className="hb-bookings-header"
          style={{
            position: 'relative',
            maxWidth: '860px',
            margin: '0 auto',
            padding: '56px 24px 44px',
            display: 'flex',
            justifyContent: 'space-between',
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
                marginBottom: '14px',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COLORS.citron, display: 'inline-block' }} />
              {player.firstName ? `Welcome back, ${player.firstName}` : 'Your schedule'}
            </div>
            <h1
              style={{
                fontFamily: "'Big Shoulders Display', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(34px, 5vw, 48px)',
                lineHeight: 0.95,
                color: COLORS.chalk,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              My <span style={{ color: COLORS.citron }}>Bookings</span>
            </h1>
          </div>
          <button
            className="hb-btn"
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(238,241,234,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              background: 'transparent',
              color: COLORS.chalk,
              border: '1px solid rgba(238,241,234,0.35)',
              borderRadius: '4px',
              padding: '11px 22px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              flexShrink: 0,
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <p style={{ color: COLORS.inkMute, textAlign: 'center', padding: '48px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
            Loading your bookings…
          </p>
        ) : error ? (
          <p style={{ color: '#B43535', textAlign: 'center', padding: '48px 0', fontSize: '14px' }}>{error}</p>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', background: 'white', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}` }}>
            <p
              style={{
                fontFamily: "'Big Shoulders Display', sans-serif",
                fontWeight: 700,
                fontSize: '24px',
                textTransform: 'uppercase',
                color: COLORS.ink,
                margin: '0 0 8px',
              }}
            >
              No bookings yet
            </p>
            <p style={{ color: COLORS.inkMute, fontSize: '14px', marginBottom: '24px' }}>
              Find a court and get your first game on the schedule.
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
                padding: '13px 26px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              Find Courts
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {upcoming.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: COLORS.teal,
                    marginBottom: '16px',
                    borderBottom: `1px solid ${COLORS.chalkDim}`,
                    paddingBottom: '10px',
                  }}
                >
                  Upcoming — {upcoming.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {upcoming.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: COLORS.inkMute,
                    marginBottom: '16px',
                    borderBottom: `1px solid ${COLORS.chalkDim}`,
                    paddingBottom: '10px',
                  }}
                >
                  Past — {past.length}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {past.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage