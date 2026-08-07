import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'
import Navbar from '../components/Navbar'

// Formats "HH:MM" or "HH:MM:SS" (24hr) into "h:mm AM/PM"
function formatTime12h(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

// Minutes between two "HH:MM:SS" (or "HH:MM") strings
function getDurationMinutes(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function BookingConfirmedPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')
  const tokenParam = searchParams.get('token')

  const [booking, setBooking] = useState(state?.booking || null)
  const [court, setCourt] = useState(state?.court || null)
  const [loading, setLoading] = useState(!state?.booking && !!bookingIdParam)
  const [error, setError] = useState(null)
  const [openPlay, setOpenPlay] = useState(state?.booking?.openPlay || null)

  useEffect(() => {
    // Arrived via client-side navigate (guest / pay-at-venue flow) — already
    // have everything needed, nothing to fetch.
    if (state?.booking) return

    // Arrived via an external redirect from Xendit's hosted checkout — no
    // React Router state survives that, so fetch the booking fresh instead.
    if (!bookingIdParam) {
      navigate('/courts')
      return
    }

    const query = tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : ''
    api.get(`/bookings/${bookingIdParam}${query}`)
      .then(res => {
        setBooking(res.data)
        setCourt(res.data.court)
        setOpenPlay(res.data.openPlay || null)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load your booking. If you were just charged, check My Bookings or contact the court.')
        setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const publicToken = booking?.publicToken || tokenParam
    if (!booking?.id || booking.bookingType !== 'OpenPlay' || !publicToken) return

    api.get(`/openplay/booking/${booking.id}?token=${encodeURIComponent(publicToken)}`)
      .then(res => setOpenPlay(res.data))
      .catch(() => {})
  }, [booking?.id, booking?.bookingType, booking?.publicToken, tokenParam])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280' }}>Loading your booking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p style={{ textAlign: 'center', padding: '80px 24px', color: '#dc2626' }}>{error}</p>
      </div>
    )
  }

  if (!booking) {
    navigate('/courts')
    return null
  }

  const isOnline = booking.paymentMethod === 'Online'
  const isPaid = booking.paymentStatus === 'Paid'
  const durationMinutes = getDurationMinutes(booking.startTime, booking.endTime)
  const totalPrice = Number(booking.amount || 0)
  const openPlayLink = openPlay?.roomCode ? `${window.location.origin}/open-play/${openPlay.roomCode}` : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>

        <div style={{ width: '64px', height: '64px', background: booking.status === 'Confirmed' ? '#dcfce7' : '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
          {booking.status === 'Confirmed' ? '✓' : '⏳'}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {isOnline && !isPaid
            ? 'Payment Processing…'
            : booking.status === 'Confirmed'
              ? 'Booking Confirmed!'
              : 'Booking Requested'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {isOnline && !isPaid
            ? "We're confirming your payment with Xendit — this usually takes just a few seconds. Refresh this page or check My Bookings shortly."
            : booking.status === 'Confirmed'
              ? 'Your court is reserved. Show this confirmation upon arrival.'
              : 'The court owner will confirm your booking once you check in and pay at the venue.'}
        </p>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>COURT</p>
              <p style={{ fontWeight: '600', fontSize: '15px' }}>{court?.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>BOOKING ID</p>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#16a34a' }}>{booking.bookingReference}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DATE</p>
              <p style={{ fontWeight: '600' }}>{new Date(booking.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TIME</p>
              <p style={{ fontWeight: '600' }}>{formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DURATION</p>
              <p style={{ fontWeight: '600' }}>{durationMinutes} Mins</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>PRICE</p>
              <p style={{ fontWeight: '700', color: '#16a34a' }}>₱{totalPrice.toFixed(2)}</p>
            </div>
          </div>

          {isOnline ? (
            isPaid ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
                ✅ <strong>Payment received</strong> — you're all set, no need to pay again at the venue.
              </div>
            ) : (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e' }}>
                ⏳ <strong>Waiting for payment confirmation</strong> — this page will update once Xendit confirms your payment.
              </div>
            )
          ) : booking.status === 'Confirmed' ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
              ✅ <strong>Confirmed</strong> — you're all set for your booking.
            </div>
          ) : (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e' }}>
              ⏳ <strong>Pending confirmation</strong> — pay at the venue when you check in to confirm your spot.
            </div>
          )}
        </div>

        {booking.bookingType === 'OpenPlay' && (
          <div style={{ background: openPlayLink ? '#f0fdf4' : '#f8fafc', border: `1px solid ${openPlayLink ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>Open Play Session</h2>
            {openPlayLink ? (
              <>
                <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '14px' }}>
                  Your booking is confirmed. Share this QR or link so logged-in players can join.
                </p>
                <div style={{ display: 'inline-flex', background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #dcfce7', marginBottom: '10px' }}>
                  <QRCodeSVG value={openPlayLink} size={150} bgColor="#ffffff" fgColor="#0f172a" level="M" />
                </div>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{openPlay.roomCode}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/open-play/${openPlay.roomCode}`)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Manage Open Play
                </button>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Your Open Play page will activate after this booking is confirmed by the court owner.
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/courts')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151' }}
          >
            Find More Courts
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmedPage
