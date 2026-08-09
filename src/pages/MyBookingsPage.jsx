import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Clock } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import { clearPlayerSession, ensurePlayerSession } from '../lib/playerSession'

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

// Booking date/time is always in Asia/Manila (UTC+8, no DST) — anchor the
// comparison instant there explicitly instead of relying on the viewer's
// local timezone, which would shift the upcoming/past boundary.
function getBookingEndInstant(b) {
  const datePart = (b.date || '').slice(0, 10)
  const endTime = b.endTime || '00:00:00'
  return new Date(`${datePart}T${endTime}+08:00`)
}

function MyBookingsPage() {
  const navigate = useNavigate()
  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadBookings() {
      const valid = await ensurePlayerSession()
      if (cancelled) return

      if (!valid) {
        navigate('/login')
        return
      }

      try {
        const res = await api.get('/users/bookings')
        if (cancelled) return
        setBookings(res.data)
      } catch (err) {
        if (cancelled) return
        const status = err.response?.status
        if (status === 401 || status === 403) {
          clearPlayerSession()
          navigate('/login')
          return
        }
        setError('Could not load your bookings. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBookings()
    return () => { cancelled = true }
  }, [navigate])

  const now = new Date()
  const upcoming = bookings.filter(b => {
    return getBookingEndInstant(b) >= now && b.status !== 'Cancelled'
  })
  const past = bookings.filter(b => !upcoming.includes(b))

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm('Cancel this booking?')
    if (!confirmed) return

    setCancellingId(booking.id)
    setError(null)
    try {
      const res = await api.patch(`/bookings/${booking.id}/cancel`)
      setBookings((prev) => prev.map((item) => (
        item.id === booking.id
          ? { ...item, status: res.data.status, paymentStatus: res.data.paymentStatus }
          : item
      )))
      if (res.data.requiresRefund) {
        setError('Booking cancelled. This paid online booking now needs manual refund review from the court owner.')
      }
    } catch (err) {
      const message = err.response?.data
      setError(typeof message === 'string' ? message : 'Could not cancel this booking. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

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
            {new Date(b.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} />
            {b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}
          </span>
        </div>
        {b.bookingType === 'OpenPlay' && (
          <div style={{ marginTop: '14px' }}>
            {b.openPlay?.active && b.openPlay?.roomCode ? (
              <button
                type="button"
                onClick={() => navigate(`/open-play/${b.openPlay.roomCode}`)}
                className="hb-btn"
                style={{
                  border: 'none',
                  background: COLORS.teal,
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Manage Open Play
              </button>
            ) : (
              <span style={{ display: 'inline-flex', borderRadius: '999px', background: 'rgba(215,226,43,0.18)', color: '#7A7F0E', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}>
                Open Play activates after confirmation
              </span>
            )}
          </div>
        )}
        {getBookingEndInstant(b) >= now && b.status !== 'Cancelled' && b.status !== 'Completed' && (
          <button
            type="button"
            onClick={() => handleCancelBooking(b)}
            disabled={cancellingId === b.id}
            className="hb-btn"
            style={{
              marginTop: '14px',
              border: '1px solid #E3C3C0',
              background: 'transparent',
              color: '#B3453D',
              borderRadius: '4px',
              padding: '9px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: cancellingId === b.id ? 'not-allowed' : 'pointer',
              opacity: cancellingId === b.id ? 0.6 : 1,
            }}
          >
            {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
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
          .hb-bookings-header { padding: calc(env(safe-area-inset-top, 0px) + 44px) 20px 36px !important; }
          .hb-bookings-body { padding: 34px 20px 64px !important; }
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
            justifyContent: 'flex-start',
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
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="hb-bookings-body" style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>
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
